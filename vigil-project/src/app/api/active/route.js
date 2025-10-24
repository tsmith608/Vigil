import { getSatelliteCartesian } from "@lib/propagate";
import * as satellite from "satellite.js";
import fs from "fs";
import path from "path";

const FILE_PATH = path.join(process.cwd(), "src/app/api/active/active.tle");
const REFRESH_INTERVAL = 8 * 60 * 60 * 1000; // 8 hours
let lastFetch = 0;

// Optional: disable TLS verification (helps on Windows/PyCharm networks)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export async function GET() {
  try {
    const now = Date.now();
    const fileExists = fs.existsSync(FILE_PATH);
    const stale = !fileExists || now - lastFetch > REFRESH_INTERVAL;

    let tleText;

    if (stale) {
      try {
        console.log("🌐 Fetching fresh Active TLE text (HTTPS)...");
        const res = await fetch(
          "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle",
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error(`CelesTrak HTTPS failed: ${res.status}`);
        tleText = await res.text();
      } catch (httpsErr) {
        console.warn("⚠️ HTTPS fetch failed, retrying via HTTP...");
        try {
          const res = await fetch(
            "http://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle",
            { cache: "no-store" }
          );
          if (!res.ok) throw new Error(`CelesTrak HTTP failed: ${res.status}`);
          tleText = await res.text();
        } catch (httpErr) {
          console.error("❌ Network fetch failed completely.");
          if (fileExists) {
            console.log("📂 Using cached TLE file instead.");
            tleText = fs.readFileSync(FILE_PATH, "utf8");
          } else {
            throw new Error("No cached TLE file available — network offline.");
          }
        }
      }

      // Save fresh file
      fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
      fs.writeFileSync(FILE_PATH, tleText, "utf8");
      lastFetch = now;
    } else {
      console.log("✅ Using cached active satellites file");
      tleText = fs.readFileSync(FILE_PATH, "utf8");
    }

    // --- Parse TLEs ---
    const lines = tleText
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const tles = [];
    for (let i = 0; i < lines.length; i += 3) {
      const nameLine = lines[i];
      const line1 = lines[i + 1];
      const line2 = lines[i + 2];
      if (!line1 || !line2) continue;

      const match = nameLine.match(/\(([^)]+)\)\s*$/);
      const country = match ? match[1] : "UNK";
      const name = nameLine.replace(/\s*\([^)]+\)\s*$/, "").trim();
      tles.push({ name, country, line1, line2 });
    }

    console.log(`📄 Parsed ${tles.length} TLE entries`);

    // --- Propagate ---
    const nowDate = new Date();
    const gmst = satellite.gstime(nowDate);

    const propagated = tles
      .map((sat) => {
        try {
          const satrec = satellite.twoline2satrec(sat.line1, sat.line2);
          const pv = satellite.propagate(satrec, nowDate);
          if (!pv?.position) return null;

          const gd = satellite.eciToGeodetic(pv.position, gmst);
          const latitude = satellite.radiansToDegrees(gd.latitude);
          const longitude = satellite.radiansToDegrees(gd.longitude);
          const altitude = gd.height;
          const cartesian = getSatelliteCartesian(latitude, longitude, altitude);

          return { name: sat.name, country: sat.country, latitude, longitude, altitude, cartesian };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    console.log(`✅ Propagated ${propagated.length} satellites successfully`);

    return new Response(JSON.stringify(propagated), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Active API fatal error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

import { getSatelliteCartesian } from "@lib/propagate";
import * as satellite from "satellite.js";
import fs from "fs";
import path from "path";

// 🛰️ Change this line per constellation
const CONSTELLATION_NAME = "GLONASS";
const FEED_URL = `https://celestrak.org/NORAD/elements/gp.php?GROUP=glo-ops&FORMAT=tle`;

const FILE_PATH = path.join(process.cwd(), "src/app/api/glonass/glonass.tle");
const REFRESH_INTERVAL = 8 * 60 * 60 * 1000; // 8 hours
let lastFetch = 0;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // helps on some Windows setups

export async function GET() {
  try {
    const now = Date.now();
    const fileExists = fs.existsSync(FILE_PATH);
    const stale = !fileExists || now - lastFetch > REFRESH_INTERVAL;

    let tleText;

    if (stale) {
      console.log(`🔄 Fetching fresh ${CONSTELLATION_NAME} TLEs...`);
      const res = await fetch(FEED_URL);
      if (!res.ok) throw new Error(`Failed to fetch ${CONSTELLATION_NAME} feed`);
      tleText = await res.text();

      fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
      fs.writeFileSync(FILE_PATH, tleText, "utf8");
      lastFetch = now;
    } else {
      console.log(`✅ Using cached ${CONSTELLATION_NAME} TLEs`);
      tleText = fs.readFileSync(FILE_PATH, "utf8");
    }

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

      // 🧩 Extract possible (XX) code or fallback to constellation name
      const match = nameLine.match(/\(([^)]+)\)\s*$/);
      const country = match ? match[1].toUpperCase() : CONSTELLATION_NAME;

      const name = nameLine.replace(/\s*\([^)]+\)\s*$/, "").trim();
      tles.push({ name, country, line1, line2 });
    }

    console.log(`📡 Parsed ${tles.length} ${CONSTELLATION_NAME} satellites`);

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

          return {
            name: sat.name,
            country: sat.country,
            latitude,
            longitude,
            altitude,
            cartesian,
          };
        } catch (err) {
          console.warn(`⚠️ Propagation failed for ${sat.name}: ${err.message}`);
          return null;
        }
      })
      .filter(Boolean);

    console.log(`✅ Propagated ${propagated.length} ${CONSTELLATION_NAME} satellites`);
    return new Response(JSON.stringify(propagated), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(`❌ ${CONSTELLATION_NAME} API error:`, err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

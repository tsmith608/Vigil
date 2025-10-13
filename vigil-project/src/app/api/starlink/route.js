import { getSatelliteCartesian } from "@lib/propagate";
import * as satellite from "satellite.js";
import fs from "fs";
import path from "path";

const FILE_PATH = path.join(process.cwd(), "src/app/api/starlink/starlink.tle");
const REFRESH_INTERVAL = 8 * 60 * 60 * 1000; // 8 hours
let lastFetch = 0;

export async function GET(request) {
  try {
    const now = Date.now();
    const fileExists = fs.existsSync(FILE_PATH);
    const stale = !fileExists || now - lastFetch > REFRESH_INTERVAL;

    let text;

    if (stale) {
      // Fetch new data from CelesTrak
      const response = await fetch("https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle");
      if (!response.ok) throw new Error("CelesTrak fetch failed");
      text = await response.text();
      fs.writeFileSync(FILE_PATH, text, "utf8");
      lastFetch = now;
      console.log("Starlink TLEs updated from CelesTrak");
    } else {
      // Read cached version
      text = fs.readFileSync(FILE_PATH, "utf8");
    }

    // Normalize CRLF to LF, split into lines, and remove empty lines
    const lines = text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // Group every 3 lines into a TLE object: { name, line1, line2 }
    const tles = [];
    for (let i = 0; i < lines.length; i += 3) {
      const name = lines[i] ?? null;
      const line1 = lines[i + 1] ?? null;
      const line2 = lines[i + 2] ?? null;
      if (name && line1 && line2) {
        tles.push({ name, line1, line2 });
      }
    }

    // Propagate each satellite once for current position
    const nowDate = new Date();
    const gmst = satellite.gstime(nowDate);

    const propagated = tles
      .map((sat) => {
        try {
          const satrec = satellite.twoline2satrec(sat.line1, sat.line2);
          const pv = satellite.propagate(satrec, nowDate);
          if (!pv.position) return null;

          const gd = satellite.eciToGeodetic(pv.position, gmst);
          const latitude = satellite.radiansToDegrees(gd.latitude);
          const longitude = satellite.radiansToDegrees(gd.longitude);
          const altitude = gd.height;
          const cartesian = getSatelliteCartesian(latitude, longitude, altitude);

          return {
            name: sat.name,
            latitude,
            longitude,
            altitude,
            cartesian,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean); // remove failed propagations

    return new Response(JSON.stringify(propagated), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

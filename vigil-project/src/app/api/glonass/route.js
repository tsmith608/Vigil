import { getSatelliteCartesian } from "@lib/propagate";
import { pool } from "@lib/db";
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
    console.log("📥 Loading BEIDOU TLEs from DB...");

        const res = await pool.query(`
        SELECT name, line1, line2
        FROM public.tles
        WHERE constellation = 'glo-ops'
        ORDER BY satnum
        `);

        const tles = res.rows.map(r => ({
        name: r.name,
        line1: r.line1,
        line2: r.line2,
        }));

        console.log(`📄 Retrieved ${tles.length} ACTIVE GLONASS entries from DB`);

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

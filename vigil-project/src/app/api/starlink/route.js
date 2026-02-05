import { getSatelliteCartesian } from "@lib/propagate";
import { pool } from "@lib/db";
import * as satellite from "satellite.js";

export async function GET(request) {
  try {
    console.log("📥 Loading STARLINK TLEs from DB...");

    const res = await pool.query(`
        SELECT name, satnum, line1, line2
        FROM public.tles
        WHERE constellation = 'starlink'
        ORDER BY satnum
        `);

    const tles = res.rows.map(r => ({
      name: r.name,
      satnum: r.satnum,
      line1: r.line1,
      line2: r.line2,
    }));

    console.log(`📄 Retrieved ${tles.length} STARLINK TLE entries from DB`);

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
            satnum: sat.satnum,
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

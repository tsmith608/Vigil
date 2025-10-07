import { propagateFullDay, getSatelliteCartesian } from "@lib/propagate";

export async function GET() {
  try {
    // Fetch ISS TLE from CelesTrak
    const tleUrl = "https://celestrak.org/NORAD/elements/stations.txt";
    const response = await fetch(tleUrl);
    const tleText = await response.text();

    // Parse lines (first satellite = ISS)
    const lines = tleText.split("\n").map(l => l.trim()).filter(Boolean);
    const tle1 = lines[1];
    const tle2 = lines[2];

    // Propagate single snapshot (current time)
    const now = new Date();
    const satrec = require("satellite.js").twoline2satrec(tle1, tle2);
    const pv = require("satellite.js").propagate(satrec, now);
    if (!pv.position) {
      return new Response(JSON.stringify({ error: "Propagation failed" }), {
        status: 500,
      });
    }

    const gmst = require("satellite.js").gstime(now);
    const gd = require("satellite.js").eciToGeodetic(pv.position, gmst);
    const latitude = require("satellite.js").radiansToDegrees(gd.latitude);
    const longitude = require("satellite.js").radiansToDegrees(gd.longitude);
    const altitude = gd.height;

    // Convert to 3D coordinates
    const cartesian = getSatelliteCartesian(latitude, longitude, altitude);

    // Return full object
    return new Response(
      JSON.stringify({
        timestamp: now.toISOString(),
        tle1,
        tle2,
        latitude,
        longitude,
        altitude,
        positionEci: pv.position,
        velocityEci: pv.velocity,
        cartesian,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

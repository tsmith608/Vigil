import * as satellite from "satellite.js";

// Full day propagation: 24h of points
export function propagateFullDay(tle1, tle2, stepMinutes = 1) {
  const satrec = satellite.twoline2satrec(tle1, tle2);
  const start = new Date();
  const path = [];

  // 24 hours = 1440 minutes
  for (let i = 0; i <= 1440; i += stepMinutes) {
    const time = new Date(start.getTime() + i * 60 * 1000);
    const pv = satellite.propagate(satrec, time);

    if (!pv.position) continue;

    const gmst = satellite.gstime(time);
    const gd = satellite.eciToGeodetic(pv.position, gmst);

    path.push({
      time: time.toISOString(),
      latitude: satellite.radiansToDegrees(gd.latitude),
      longitude: satellite.radiansToDegrees(gd.longitude),
      altitude: gd.height,
      positionEci: pv.position,
      velocityEci: pv.velocity,
    });
  }

  return path;
}

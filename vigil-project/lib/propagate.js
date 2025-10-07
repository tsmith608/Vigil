import * as satellite from "satellite.js";

const EARTH_RADIUS_KM = 6371;

//convert lat, lon, alt to 3D coordinates
export function getSatelliteCartesian(lat, lon, alt) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const radius = EARTH_RADIUS_KM + alt;

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return { x, y, z };
}

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

    const latitude = satellite.radiansToDegrees(gd.latitude);
    const longitude = satellite.radiansToDegrees(gd.longitude);
    const altitude = gd.height;
    const cartesian = getSatelliteCartesian(latitude, longitude, altitude);

    path.push({
      time: time.toISOString(),
      latitude,
      longitude,
      altitude,
      positionEci: pv.position,
      velocityEci: pv.velocity,
      cartesian,
    });
  }

  return path;
}

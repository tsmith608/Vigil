import * as satellite from "satellite.js";
export async function GET(request) {
  // Fetch the TLE data from Celestrak, Starlink group
  const response = await fetch("https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle");
  const text = await response.text();

  // Normalize CRLF to LF, split into lines, and remove empty lines
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").map(l => l.trim()).filter(l => l.length > 0);

  // Group every 3 lines into a TLE object: { name, line1, line2 }
  const tles = [];
  for (let i = 0; i < lines.length; i += 3) {
    const name = lines[i] ?? null;
    const line1 = lines[i + 1] ?? null;
    const line2 = lines[i + 2] ?? null;
    // Only include fully-formed triples
    if (name && line1 && line2) {
      tles.push({ name, line1, line2 });
    }
  }

  return new Response(JSON.stringify(tles), {
    status: 200,
    headers: { 'Content-Type': 'application/json' } 
  });

  // Process the TLEs using satellite.js
  //for (const tle of tles) {
  // Example ISS TLE
  const tleLine1 = "1 25544U 98067A   20344.91667824  .00001264  00000-0  29621-4 0  9993";
  const tleLine2 = "2 25544  51.6451  21.4580 0001471  48.8120  69.3402 15.49362719256626";
  const satrec = satellite.twoline2satrec(tleLine1, tleLine2);

  const now = new Date();

  // Propagate satellite using time since epoch (in minutes)
  const positionAndVelocity = satellite.propagate(satrec, now);
  const positionEci = positionAndVelocity.position;
  const velocityEci = positionAndVelocity.velocity;

  // Now Use the position and velocity to calculate Latitude, Longitude, Altitude
  const gmst = satellite.gstime(now);
  const positionGd = satellite.eciToGeodetic(positionEci, gmst);
  const longitude = satellite.radiansToDegrees(positionGd.longitude);
  const latitude = satellite.radiansToDegrees(positionGd.latitude);
  const altitude = positionGd.height;

  console.log(`Satellite: ISS @ ${now.toISOString()}`);
  console.log(`Longitude: ${longitude}, Latitude: ${latitude}, Altitude: ${altitude}`);




}

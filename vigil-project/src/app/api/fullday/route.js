import { propagateFullDay } from "@lib/propagate";

export async function GET() {
  try {
    // Fetch ISS TLE from CelesTrak
    const tleUrl = "https://celestrak.org/NORAD/elements/stations.txt";
    const response = await fetch(tleUrl);
    const tleText = await response.text();

    // Parse out first two lines after "ISS (ZARYA)"
    const lines = tleText.split("\n").map(l => l.trim()).filter(Boolean);
    const tle1 = lines[1]; // first TLE line
    const tle2 = lines[2]; // second TLE line

    // Propagate full day
    const track = propagateFullDay(tle1, tle2, 1); // 1-min step

    return new Response(JSON.stringify(track), {
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
// /api/fullday - Returns a full day (24h) of ISS position data using live TLE from CelesTrak
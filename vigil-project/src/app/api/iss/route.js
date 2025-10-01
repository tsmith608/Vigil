import { propagateSatellite } from "@lib/propagate"; 

export async function GET() {
  const tle1 = "1 25544U 98067A   20344.91667824  .00001264  00000-0  29621-4 0  9993";
  const tle2 = "2 25544  51.6451  21.4580 0001471  48.8120  69.3402 15.49362719256626";

  const result = propagateSatellite(tle1, tle2);

  if (!result) {
    return new Response(JSON.stringify({ error: "Propagation failed" }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// /api/iss - Returns the current position of the ISS using hardcoded TLE data
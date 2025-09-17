export async function GET(request) {
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
}

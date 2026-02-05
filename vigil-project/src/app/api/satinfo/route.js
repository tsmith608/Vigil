import { pool } from "@lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const satnum = searchParams.get("satnum");

    if (!satnum) {
      return new Response(JSON.stringify({ error: "satnum required" }), { status: 400 });
    }

    // Only query fields that ACTUALLY EXIST in the DB
    const result = await pool.query(
      `
      SELECT 
        name,
        satnum,
        intldes_year,
        inclination_deg,
        raan_deg,
        eccentricity,
        line1,
        line2
      FROM public.tles
      WHERE satnum = $1
      LIMIT 1
      `,
      [satnum]
    );

    if (result.rows.length === 0) {
      return new Response(JSON.stringify({ error: "Satellite not found" }), { status: 404 });
    }

    return new Response(JSON.stringify(result.rows[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("❌ satinfo query error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

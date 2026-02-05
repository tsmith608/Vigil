import { pool } from "@lib/db";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q");

        if (!q || q.length < 2) {
            return new Response(JSON.stringify([]), { status: 200 });
        }

        const result = await pool.query(
            `
      SELECT 
        name,
        satnum,
        line1,
        line2
      FROM public.tles
      WHERE name ILIKE $1 OR satnum::text ILIKE $1
      ORDER BY name ASC
      LIMIT 10
      `,
            [`%${q}%`]
        );

        return new Response(JSON.stringify(result.rows), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (err) {
        console.error("❌ Search API error:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

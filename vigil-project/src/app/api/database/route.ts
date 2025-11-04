// /app/api/tle-build/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import * as satellite from 'satellite.js';
import { splitLines, type TleCols } from '@lib/splitLines';
import saveRowsPg from '@lib/saveRows';
import { pool } from '@lib/pg'; // <-- field-based pg Pool with SSL rejectUnauthorized:false

const CONSTELLATIONS = [
  // 'beidou', 'globalstar', 'glo-ops', 'gps-ops', 'oneweb', 'starlink', 'iridium',
  'active',
];

const urlFor = (g: string) =>
  `https://celestrak.org/NORAD/elements/gp.php?GROUP=${encodeURIComponent(g)}&FORMAT=tle`;

type DrizzleReady = TleCols & {
  constellation: string;
  name: string;
  line1: string;
  line2: string;
  x_km: number | null;
  y_km: number | null;
  z_km: number | null;
};

// ---- small helpers for stale-check storage ----
const TTL_HOURS = Number(process.env.CRON_TLE_TTL_HOURS ?? 8);
const TTL_MS = TTL_HOURS * 60 * 60 * 1000;

async function ensureRefreshLogTable() {
  // idempotent
  await pool.query(`
    create table if not exists public.refresh_log (
      constellation text primary key,
      fetched_at timestamptz not null default now()
    );
  `);
}

async function isStale(group: string) {
  try {
    const { rows } = await pool.query(
      `select fetched_at from public.refresh_log where constellation = $1`,
      [group]
    );
    if (!rows.length) return true;
    const last = new Date(rows[0].fetched_at).getTime();
    return Date.now() - last > TTL_MS;
  } catch {
    // if table missing or any error, treat as stale so we still fetch
    return true;
  }
}

async function markFetched(group: string) {
  await pool.query(
    `insert into public.refresh_log (constellation, fetched_at)
     values ($1, now())
     on conflict (constellation) do update set fetched_at = excluded.fetched_at`,
    [group]
  );
}

export async function GET(req: Request) {
  try {
    // ---- secret cron lock ----
    const isCron = req.headers.get('x-vercel-cron') === '1';
    const headerKey = req.headers.get('x-cron-key');
    const envKey = process.env.CRON_SECRET;

    if (envKey) {
      // allow either vercel cron or matching header token
      if (!isCron && headerKey !== envKey) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
      }
    }

    // ensure the refresh log exists (no-op if already there)
    await ensureRefreshLogTable();

    const rows: DrizzleReady[] = [];
    const now = new Date();
    const gmst = satellite.gstime(now);

    const processed: Array<{ group: string; fetched: boolean; inserted: number }> = [];

    for (const group of CONSTELLATIONS) {
      const stale = await isStale(group);
      if (!stale) {
        processed.push({ group, fetched: false, inserted: 0 });
        continue; // skip fetching this constellation — still fresh
      }

      const res = await fetch(urlFor(group), { cache: 'no-store' });
      if (!res.ok) throw new Error(`${group} fetch failed: ${res.status}`);

      const text = await res.text();
      const lines = text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      let insertedForGroup = 0;

      for (let i = 0; i + 2 < lines.length; i += 3) {
        const name = lines[i];
        const line1 = lines[i + 1];
        const line2 = lines[i + 2];
        if (!name || !line1 || !line2) continue;

        // tokenize L1/L2 → DB columns
        let cols: TleCols;
        try {
          cols = splitLines(line1, line2, name);
        } catch {
          // skip malformed triple
          continue;
        }

        // propagate once to "now" → ECEF x/y/z (km)
        let x_km: number | null = null;
        let y_km: number | null = null;
        let z_km: number | null = null;

        try {
          const satrec = satellite.twoline2satrec(line1, line2);
          const pv = satellite.propagate(satrec, now);
          const eci = pv?.position; // km
          if (eci) {
            const ecf = satellite.eciToEcf(eci, gmst); // km
            x_km = ecf.x;
            y_km = ecf.y;
            z_km = ecf.z;
          }
        } catch {
          // keep nulls on propagation failure
        }

        rows.push({
          name,
          ...cols,
          line1,
          line2,
          x_km,
          y_km,
          z_km,
          constellation: group,
        });

        insertedForGroup++;
      }

      // persist per group in chunks (and mark fetched)
      if (insertedForGroup > 0) {
        await saveRowsPg(rows.splice(0, rows.length), 500);
      }
      await markFetched(group);
      processed.push({ group, fetched: true, inserted: insertedForGroup });
    }

    return NextResponse.json(
      {
        ok: true,
        ttl_hours: TTL_HOURS,
        processed,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

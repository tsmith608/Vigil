import { pool } from './pg';

const COLS = [
  'name','satnum','classification',
  'intldes_year','intldes_launch_num','intldes_piece',
  'epoch_str','epoch_year','epoch_doy','epoch_ts',
  'mean_motion_dot','mean_motion_ddot','bstar','ephemeris_type','elset_num',
  'inclination_deg','raan_deg','eccentricity','arg_perigee_deg','mean_anomaly_deg',
  'mean_motion_rev_per_day','rev_number_at_epoch',
  'line1','line2','x_km','y_km','z_km',
  'constellation', 
];

export default async function saveRowsPg(rows: any[], chunkSize = 500) {
  if (!rows?.length) return { inserted: 0, batches: 0 };

  let inserted = 0, batches = 0;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const batch = rows.slice(i, i + chunkSize);

    // Build flat params matching COLS order
    const params: any[] = [];
    for (const r of batch) {
      params.push(
        r.name, r.satnum, r.classification,
        r.intldes_year, r.intldes_launch_num, r.intldes_piece,
        r.epoch_str, r.epoch_year, r.epoch_doy, r.epoch_ts ?? null,
        r.mean_motion_dot, r.mean_motion_ddot, r.bstar, r.ephemeris_type, r.elset_num,
        r.inclination_deg, r.raan_deg, r.eccentricity, r.arg_perigee_deg, r.mean_anomaly_deg,
        r.mean_motion_rev_per_day, r.rev_number_at_epoch,
        r.line1, r.line2, r.x_km, r.y_km, r.z_km,
        r.constellation ?? null
      );
    }

    const colsPerRow = COLS.length;
    const tuples = batch.map((_, rowIdx) => {
      const start = rowIdx * colsPerRow;
      const ph = Array.from({ length: colsPerRow }, (_, j) => `$${start + j + 1}`);
      return `(${ph.join(',')})`;
    }).join(',');

    // Guard to catch mismatches early
    if (params.length !== colsPerRow * batch.length) {
      throw new Error(`Param mismatch: cols=${colsPerRow}, rows=${batch.length}, params=${params.length}`);
    }

    const text = `
      INSERT INTO public.tles (${COLS.map(c => `"${c}"`).join(',')})
      VALUES ${tuples}
      ON CONFLICT ("satnum","epoch_str") DO UPDATE SET
        "elset_num" = EXCLUDED."elset_num",
        "x_km" = EXCLUDED."x_km",
        "y_km" = EXCLUDED."y_km",
        "z_km" = EXCLUDED."z_km",
        "line1" = EXCLUDED."line1",
        "line2" = EXCLUDED."line2",
        "constellation" = EXCLUDED."constellation"
    `;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(text, params);
      await client.query('COMMIT');
      inserted += batch.length;
      batches += 1;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  return { inserted, batches };
}

export type TleCols = {
  satnum: number;
  classification: string;
  intldes_year: number;
  intldes_launch_num: number;
  intldes_piece: string;

  epoch_str: string;
  epoch_year: number;
  epoch_doy: number;
  epoch_ts: Date | null;

  mean_motion_dot: number | null;
  mean_motion_ddot: number | null;
  bstar: number | null;
  ephemeris_type: number;
  elset_num: number;

  inclination_deg: number;
  raan_deg: number;
  eccentricity: number;
  arg_perigee_deg: number;
  mean_anomaly_deg: number;
  mean_motion_rev_per_day: number;
  rev_number_at_epoch: number;
};

export function splitLines(
    line1: string,
    line2: string,
    satName?: string,
    warn?: (msg: string) => void
): TleCols {
  const t1 = line1.trim().split(/\s+/);
  const t2 = line2.trim().split(/\s+/);

  if (!t1[0]?.startsWith('1') || t1.length < 9) {
    throw new Error(
      `Bad TLE line 1 [${satName ?? 'unknown'}]\nraw="${line1}"\ntokens=${JSON.stringify(t1)}`
    );
  }
  if (!t2[0]?.startsWith('2') || t2.length < 8) {
    throw new Error(
      `Bad TLE line 2 [${satName ?? 'unknown'}]\nraw="${line2}"\ntokens=${JSON.stringify(t2)}`
    );
  }

  // satnum + class (e.g., "36828U")
  const satField = t1[1] ?? '';
  const satnum = parseInt(satField.slice(0, 5), 10);
  const classification = satField.slice(5) || 'U';

  // international designator (YY NNN piece… piece can be >1 char)
  const id = t1[2] ?? '';
  const intldes_year = normalizeCentury(parseInt(id.slice(0, 2), 10));
  const intldes_launch_num = parseInt(id.slice(2, 5), 10);
  const intldes_piece = id.slice(5);

  const epoch_str = t1[3] ?? '';
  const { epoch_year, epoch_doy, epoch_ts } = parseEpoch(epoch_str);

  const mean_motion_dot = safeFloat(t1[4]);
  const mean_motion_ddot = parseTleExp(t1[5] ?? '');
  const bstar = parseTleExp(t1[6] ?? '');
  const ephemeris_type = parseInt(t1[7] ?? '0', 10);
  const elset_num = parseInt((t1[8] ?? '').slice(0, -1), 10);

  const inclination_deg = parseFloat(t2[2] ?? '0');
  const raan_deg = parseFloat(t2[3] ?? '0');
  const eccToken = t2[4] ?? '0';
  const eccentricity = parseFloat(`0.${eccToken.replace(/^0+$/, '0')}`);
  const arg_perigee_deg = parseFloat(t2[5] ?? '0');
  const mean_anomaly_deg = parseFloat(t2[6] ?? '0');
  const mean_motion_rev_per_day = parseFloat(t2[7] ?? '0');
  const rev_number_at_epoch = parseInt((t2[8] ?? '').slice(0, -1), 10) || 0;

  return {
    satnum,
    classification,
    intldes_year,
    intldes_launch_num,
    intldes_piece,
    epoch_str,
    epoch_year,
    epoch_doy,
    epoch_ts,
    mean_motion_dot,
    mean_motion_ddot,
    bstar,
    ephemeris_type,
    elset_num,
    inclination_deg,
    raan_deg,
    eccentricity,
    arg_perigee_deg,
    mean_anomaly_deg,
    mean_motion_rev_per_day,
    rev_number_at_epoch,
  };
}

// helpers
function parseEpoch(s: string) {
  const yy = parseInt(s.slice(0, 2), 10);
  const year = normalizeCentury(yy);
  const doyFloat = parseFloat(s.slice(2));
  const dayInt = Math.floor(doyFloat);
  const frac = doyFloat - dayInt;
  const secs = Math.round(frac * 86400);
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const epoch = new Date(jan1.getTime() + (dayInt - 1) * 86400_000 + secs * 1000);
  return { epoch_year: year, epoch_doy: doyFloat, epoch_ts: epoch };
}
function parseTleExp(s: string): number | null {
  if (!s) return null;
  const sign = s[0] === '-' ? -1 : 1;
  const body = s.replace(/^[-+]?/, '');
  const mant = parseInt(body.slice(0, 5), 10);
  const expSign = body[5] === '-' ? -1 : 1;
  const exp = parseInt(body.slice(6), 10);
  if (Number.isNaN(mant) || Number.isNaN(exp)) return null;
  return sign * mant * Math.pow(10, expSign * exp - 5);
}
function normalizeCentury(yy: number) { return yy >= 57 ? 1900 + yy : 2000 + yy; }
function safeFloat(s?: string) {
  if (!s) return null;
  const n = parseFloat(s.replace(/^\+/, ''));
  return Number.isFinite(n) ? n : null;
}

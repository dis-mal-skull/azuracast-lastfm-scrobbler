import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadDotEnv(file = resolve(process.cwd(), '.env')) {
  if (!existsSync(file)) return;
  const text = readFileSync(file, 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadDotEnv();

function stripTrailingSlash(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

function toInt(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function toBool(value, fallback) {
  if (value === undefined || value === '') return fallback;
  return !['false', '0', 'no', 'off'].includes(String(value).trim().toLowerCase());
}

export const config = {
  azuracastUrl: stripTrailingSlash(process.env.AZURACAST_URL),
  shortcode: (process.env.STATION_SHORTCODE || '').trim(),
  lastfm: {
    apiKey: (process.env.LASTFM_API_KEY || '').trim(),
    apiSecret: (process.env.LASTFM_API_SECRET || '').trim(),
    sessionKey: (process.env.LASTFM_SESSION_KEY || '').trim(),
  },
  pollIntervalMs: Math.max(5, toInt(process.env.POLL_INTERVAL_SECONDS, 15)) * 1000,
  requestTimeoutMs: Math.max(3, toInt(process.env.REQUEST_TIMEOUT_SECONDS, 15)) * 1000,
  scrobbleEnabled: toBool(process.env.SCROBBLE_ENABLED, true),
  scrobbleUnique: toBool(process.env.SCROBBLE_UNIQUE, false),
  logLevel: (process.env.LOG_LEVEL || 'info').trim().toLowerCase(),
};

export { loadDotEnv };

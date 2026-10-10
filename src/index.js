import { config } from './config.js';
import { createLogger } from './logger.js';
import { LastFm } from './lastfm.js';
import { fetchNowPlaying } from './azuracast.js';
import { Scrobbler } from './scrobbler.js';

const logger = createLogger(config.logLevel);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function requireConfig() {
  const missing = [];
  if (!config.azuracastUrl) missing.push('AZURACAST_URL');
  if (!config.lastfm.apiKey) missing.push('LASTFM_API_KEY');
  if (!config.lastfm.apiSecret) missing.push('LASTFM_API_SECRET');
  if (!config.lastfm.sessionKey) missing.push('LASTFM_SESSION_KEY (ejecuta: npm run auth)');

  if (missing.length) {
    logger.error('Faltan variables de configuracion: ' + missing.join(', '));
    logger.error('Copia .env.example a .env, completalo y ejecuta "npm run auth".');
    process.exit(1);
  }
}

async function main() {
  requireConfig();

  const lastfm = new LastFm({ ...config.lastfm, timeoutMs: config.requestTimeoutMs });
  const scrobbler = new Scrobbler({
    lastfm,
    logger,
    scrobbleEnabled: config.scrobbleEnabled,
    scrobbleUnique: config.scrobbleUnique,
  });

  let running = true;
  const stop = () => {
    running = false;
    logger.info('Deteniendo...');
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  logger.info(
    `Vigilando ${config.azuracastUrl} / emisora "${config.shortcode || 'auto'}" cada ${config.pollIntervalMs / 1000}s`,
  );
  logger.info(`Modo scrobble: ${config.scrobbleEnabled ? 'ACTIVADO' : 'DESACTIVADO (solo now playing)'}`);
  logger.info(
    `Repetidos: ${config.scrobbleUnique ? 'omitidos (scrobble unico por tema)' : 'permitidos (scrobble cada reproduccion)'}`,
  );

  let consecutiveErrors = 0;
  while (running) {
    try {
      const np = await fetchNowPlaying({
        baseUrl: config.azuracastUrl,
        shortcode: config.shortcode,
        timeoutMs: config.requestTimeoutMs,
      });
      consecutiveErrors = 0;
      await scrobbler.handle(np);
    } catch (err) {
      consecutiveErrors += 1;
      logger.warn(`Error consultando AzuraCast (${consecutiveErrors}): ${err.message}`);
    }
    await sleep(config.pollIntervalMs);
  }

  logger.info('Fin.');
}

main().catch((err) => {
  logger.error(err?.stack || err?.message || String(err));
  process.exit(1);
});

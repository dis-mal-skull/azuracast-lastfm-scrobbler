import { config } from '../src/config.js';
import { LastFm } from '../src/lastfm.js';
import { listStations } from '../src/azuracast.js';
import { createLogger } from '../src/logger.js';

const logger = createLogger('info');

async function checkAzuraCast() {
  if (!config.azuracastUrl) {
    logger.error('Falta AZURACAST_URL en tu .env');
    return;
  }
  logger.info(`Consultando ${config.azuracastUrl}/api/nowplaying ...`);
  try {
    const stations = await listStations({
      baseUrl: config.azuracastUrl,
      timeoutMs: config.requestTimeoutMs,
    });
    console.log('\nEmisoras encontradas:');
    for (const s of stations) {
      const st = s?.station || {};
      const cur = s?.now_playing?.song;
      console.log(
        ` - shortcode: ${st.shortcode ?? '?'}   id: ${st.id ?? '?'}   nombre: ${st.name ?? '?'}`,
      );
      console.log(`   online: ${s?.is_online}   sonando: ${cur?.text ?? '(nada)'}`);
    }
    console.log('\nUsa el "shortcode" como STATION_SHORTCODE en tu .env');
  } catch (err) {
    logger.error(`No se pudo leer la API de AzuraCast: ${err.message}`);
  }
}

async function checkLastFm() {
  if (!config.lastfm.apiKey || !config.lastfm.apiSecret || !config.lastfm.sessionKey) {
    logger.info('Last.fm sin configurar del todo. Rellena el .env y ejecuta "npm run auth".');
    return;
  }
  try {
    const lastfm = new LastFm({ ...config.lastfm, timeoutMs: config.requestTimeoutMs });
    const user = await lastfm.getUserInfo();
    console.log(`\nLast.fm OK. Sesion del usuario: ${user.name} (scrobbles: ${user.playcount})`);
  } catch (err) {
    logger.warn(`Last.fm: ${err.message}`);
  }
}

async function main() {
  await checkAzuraCast();
  await checkLastFm();
}

main().catch((err) => {
  logger.error(err?.message || String(err));
  process.exit(1);
});

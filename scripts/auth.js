import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { config } from '../src/config.js';
import { LastFm } from '../src/lastfm.js';
import { createLogger } from '../src/logger.js';

const logger = createLogger('info');

function upsertEnv(file, key, value) {
  let lines = existsSync(file) ? readFileSync(file, 'utf8').split(/\r?\n/) : [];
  let found = false;
  lines = lines.map((line) => {
    if (line.trim().startsWith(`${key}=`)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });
  if (!found) lines.push(`${key}=${value}`);
  writeFileSync(file, lines.join('\n'), 'utf8');
}

async function main() {
  if (!config.lastfm.apiKey || !config.lastfm.apiSecret) {
    logger.error('Define LASTFM_API_KEY y LASTFM_API_SECRET en tu .env antes de autenticar.');
    process.exit(1);
  }

  const lastfm = new LastFm({
    apiKey: config.lastfm.apiKey,
    apiSecret: config.lastfm.apiSecret,
    timeoutMs: config.requestTimeoutMs,
  });

  const token = await lastfm.getToken();
  const authUrl =
    `https://www.last.fm/api/auth/?api_key=${encodeURIComponent(config.lastfm.apiKey)}` +
    `&token=${encodeURIComponent(token)}`;

  console.log('\n1) Abre esta URL en el navegador y autoriza la aplicacion:');
  console.log('   ' + authUrl);
  console.log('\n2) Cuando hayas autorizado, vuelve aqui y pulsa ENTER.\n');

  const rl = createInterface({ input: stdin, output: stdout });
  await rl.question('Pulsa ENTER para continuar...');
  rl.close();

  const session = await lastfm.getSession(token);

  console.log('\nAutenticacion correcta.');
  console.log('Usuario Last.fm: ' + session.name);
  console.log('LASTFM_SESSION_KEY=' + session.key);

  const envPath = resolve(process.cwd(), '.env');
  upsertEnv(envPath, 'LASTFM_SESSION_KEY', session.key);
  console.log(`\nSession key guardada en ${envPath}`);
}

main().catch((err) => {
  logger.error(err?.message || String(err));
  process.exit(1);
});

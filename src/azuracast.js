const USER_AGENT = 'Mozilla/5.0 (compatible; azuracast-lastfm-scrobbler/1.0)';

export class AzuraCastError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AzuraCastError';
  }
}

async function getJson(url, timeoutMs) {
  let res;
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw new AzuraCastError(`No se pudo contactar a AzuraCast (${url}): ${err.message}`);
  }
  if (!res.ok) {
    throw new AzuraCastError(`AzuraCast respondio HTTP ${res.status} en ${url}`);
  }
  try {
    return await res.json();
  } catch {
    throw new AzuraCastError(`Respuesta no JSON de AzuraCast en ${url}`);
  }
}

function stationList(data) {
  return Array.isArray(data) ? data : [data];
}

/**
 * Devuelve el objeto now-playing de una emisora.
 * Si no se indica shortcode y solo hay una emisora, la usa automaticamente.
 */
export async function fetchNowPlaying({ baseUrl, shortcode, timeoutMs = 15000 }) {
  if (!baseUrl) throw new AzuraCastError('Falta AZURACAST_URL');

  const url = shortcode
    ? `${baseUrl}/api/nowplaying/${encodeURIComponent(shortcode)}`
    : `${baseUrl}/api/nowplaying`;

  const data = await getJson(url, timeoutMs);

  if (shortcode) return data;

  const stations = stationList(data);
  if (stations.length === 1) return stations[0];
  const names = stations
    .map((s) => s?.station?.shortcode ?? s?.station?.id ?? '?')
    .join(', ');
  throw new AzuraCastError(
    `Tu AzuraCast tiene ${stations.length} emisoras. Define STATION_SHORTCODE. Disponibles: ${names}`,
  );
}

export async function listStations({ baseUrl, timeoutMs = 15000 }) {
  if (!baseUrl) throw new AzuraCastError('Falta AZURACAST_URL');
  const data = await getJson(`${baseUrl}/api/nowplaying`, timeoutMs);
  return stationList(data);
}

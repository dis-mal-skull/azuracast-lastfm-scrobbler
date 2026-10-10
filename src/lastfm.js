import crypto from 'node:crypto';

const API_ROOT = 'https://ws.audioscrobbler.com/2.0/';
const USER_AGENT = 'azuracast-lastfm-scrobbler/1.0';

function md5(value) {
  return crypto.createHash('md5').update(value, 'utf8').digest('hex');
}

export class LastFmError extends Error {
  constructor(message, { code, httpStatus } = {}) {
    super(message);
    this.name = 'LastFmError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export class LastFm {
  constructor({ apiKey, apiSecret, sessionKey = '', timeoutMs = 15000 } = {}) {
    if (!apiKey || !apiSecret) {
      throw new Error('Faltan LASTFM_API_KEY y/o LASTFM_API_SECRET');
    }
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.sessionKey = sessionKey;
    this.timeoutMs = timeoutMs;
  }

  sign(params) {
    const base = Object.keys(params)
      .filter(
        (k) =>
          k !== 'format' &&
          k !== 'callback' &&
          params[k] !== undefined &&
          params[k] !== null &&
          params[k] !== '',
      )
      .sort()
      .map((k) => k + params[k])
      .join('');
    return md5(base + this.apiSecret);
  }

  async call(method, params = {}) {
    const body = new URLSearchParams();
    body.set('method', method);
    body.set('api_key', this.apiKey);
    body.set('format', 'json');
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        body.set(key, String(value));
      }
    }
    if (this.sessionKey) body.set('sk', this.sessionKey);

    const signature = this.sign(Object.fromEntries(body.entries()));
    body.set('api_sig', signature);

    let res;
    try {
      res = await fetch(API_ROOT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': USER_AGENT,
        },
        body,
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (err) {
      throw new LastFmError(`No se pudo contactar a Last.fm: ${err.message}`);
    }

    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }

    if (!res.ok) {
      throw new LastFmError(`Last.fm respondio HTTP ${res.status}: ${text.slice(0, 200)}`, {
        httpStatus: res.status,
      });
    }
    if (!json) {
      throw new LastFmError(`Respuesta no JSON de Last.fm: ${text.slice(0, 200)}`);
    }
    if (json.error) {
      throw new LastFmError(`Last.fm error ${json.error}: ${json.message}`, { code: json.error });
    }
    return json;
  }

  async getToken() {
    const data = await this.call('auth.getToken');
    return data.token;
  }

  async getSession(token) {
    const data = await this.call('auth.getSession', { token });
    return data.session;
  }

  updateNowPlaying({ artist, track, album, duration }) {
    return this.call('track.updateNowPlaying', {
      artist,
      track,
      album,
      duration: duration || undefined,
    });
  }

  scrobble({ artist, track, album, duration, timestamp }) {
    return this.call('track.scrobble', {
      artist,
      track,
      album,
      duration: duration || undefined,
      timestamp,
    });
  }

  async getUserInfo() {
    const data = await this.call('user.getInfo');
    return data.user;
  }
}

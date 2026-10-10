const MIN_SCROBBLE_DURATION = 30;

function toInt(value, fallback = 0) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function splitText(text) {
  const t = String(text || '').trim();
  const idx = t.indexOf(' - ');
  if (idx === -1) return { artist: '', title: t };
  return { artist: t.slice(0, idx).trim(), title: t.slice(idx + 3).trim() };
}

export class Scrobbler {
  constructor({ lastfm, logger, scrobbleEnabled = true }) {
    this.lastfm = lastfm;
    this.logger = logger;
    this.scrobbleEnabled = scrobbleEnabled;
    this.current = null;
    this.scrobbled = new Set();
  }

  normalize(np) {
    const n = np?.now_playing;
    const song = n?.song;
    if (!song) return null;

    const fromText = splitText(song.text || `${song.artist || ''} - ${song.title || ''}`);
    const artist = String(song.artist || fromText.artist || '').trim();
    const title = String(song.title || fromText.title || song.text || '').trim();
    if (!artist || !title) return null;

    const duration = toInt(n.duration, 0);
    const elapsed = toInt(n.elapsed, 0);
    const playedAt = toInt(n.played_at, 0) || Math.floor(Date.now() / 1000) - elapsed;
    const id =
      n.sh_id !== undefined && n.sh_id !== null
        ? `sh:${n.sh_id}`
        : `tk:${artist}\u0000${title}\u0000${playedAt}`;

    return {
      id,
      artist,
      title,
      album: String(song.album || '').trim(),
      duration,
      playedAt,
    };
  }

  async handle(np) {
    const online = np?.is_online !== false;
    const track = online ? this.normalize(np) : null;

    if (!track) {
      await this.finishCurrent('sin reproduccion');
      return;
    }

    if (!this.current) {
      this.current = track;
      await this.announce(track);
      return;
    }

    if (track.id !== this.current.id) {
      await this.finishCurrent('cambio de cancion');
      this.current = track;
      await this.announce(track);
    }
  }

  async announce(track) {
    const label = `${track.artist} - ${track.title}` + (track.album ? ` [${track.album}]` : '');
    this.logger.info(`Now playing: ${label}`);
    try {
      await this.lastfm.updateNowPlaying({
        artist: track.artist,
        track: track.title,
        album: track.album || undefined,
        duration: track.duration || undefined,
      });
    } catch (err) {
      this.logger.warn(`No se pudo enviar 'now playing': ${err.message}`);
    }
  }

  async finishCurrent(reason) {
    const track = this.current;
    this.current = null;
    if (!track) return;
    if (this.scrobbled.has(track.id)) return;

    const label = `${track.artist} - ${track.title}`;
    if (track.duration > 0 && track.duration < MIN_SCROBBLE_DURATION) {
      this.logger.debug(`Omitida por durar <${MIN_SCROBBLE_DURATION}s: ${label}`);
      return;
    }

    if (!this.scrobbleEnabled) {
      this.logger.info(`(scrobble desactivado) ${label}`);
      return;
    }

    try {
      await this.lastfm.scrobble({
        artist: track.artist,
        track: track.title,
        album: track.album || undefined,
        duration: track.duration || undefined,
        timestamp: track.playedAt,
      });
      this.scrobbled.add(track.id);
      if (this.scrobbled.size > 500) {
        const recent = [...this.scrobbled].slice(-250);
        this.scrobbled = new Set(recent);
      }
      this.logger.info(`Scrobble (${reason}): ${label}`);
    } catch (err) {
      this.logger.warn(`Fallo al scrobble (${label}): ${err.message}`);
    }
  }
}

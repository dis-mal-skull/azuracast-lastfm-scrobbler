const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

export function createLogger(level = 'info') {
  const threshold = LEVELS[level] ?? LEVELS.info;

  const emit = (lvl, message, extra) => {
    if (LEVELS[lvl] > threshold) return;
    const line = `[${new Date().toISOString()}] ${lvl.toUpperCase().padEnd(5)} ${message}`;
    const args = extra === undefined ? [line] : [line, extra];
    if (lvl === 'error' || lvl === 'warn') console.error(...args);
    else console.log(...args);
  };

  return {
    error: (m, e) => emit('error', m, e),
    warn: (m, e) => emit('warn', m, e),
    info: (m, e) => emit('info', m, e),
    debug: (m, e) => emit('debug', m, e),
  };
}

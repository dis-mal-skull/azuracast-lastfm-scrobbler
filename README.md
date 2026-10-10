# AzuraCast → Last.fm Scrobbler

A tiny, **dependency-free** Node.js connector that mirrors what is playing on an
[AzuraCast](https://www.azuracast.com/) radio station to your
[Last.fm](https://www.last.fm/) profile. It updates your **Now Playing** and
scrobbles every track as if you were listening to the station.

AzuraCast has **no native Last.fm scrobbling** (its built-in Last.fm integration
is only used to look up album art), so this tool fills the gap from the outside:
it reads the station's public *Now Playing* API and talks to the official Last.fm
scrobbling API (`track.updateNowPlaying` + `track.scrobble`).

> Perfect for radio owners who want their station's music to appear on their
> Last.fm profile automatically.

---

## Features

- Sends Last.fm **Now Playing** and **scrobbles** for every track played on the station.
- Works with a specific station or auto-detects it when there is only one.
- **Zero runtime dependencies** — uses Node's built-in `fetch` and `crypto`. Requires **Node 18.17+**.
- Configured with a simple `.env` file.
- Includes **Docker** and **systemd** deployment options.
- Resilient: retries when the station or Last.fm is temporarily down, and flushes
  the pending scrobble when the station stops.
- Skips tracks shorter than 30 seconds and de-duplicates scrobbles.

## How it works

```
 Last.fm  <── scrobble / now playing ──  this tool  ── poll /api/nowplaying ──>  AzuraCast
```

On every poll it compares the current track (`sh_id`). When a new track starts it
sends `track.updateNowPlaying`; when the track is replaced (or the station stops)
it sends `track.scrobble` using the station's real `played_at` timestamp.

---

## Requirements

- **Node.js 18.17+** (no `npm install` needed — there are no dependencies).
- A **Last.fm account** with an **API key** + **shared secret**.
- The **base URL** and **shortcode** of your AzuraCast station.

---

## 1. Get your Last.fm API credentials

1. Log in to Last.fm and create an application at
   <https://www.last.fm/api/account/create>.
   - **Application name**: anything, e.g. `My Radio Scrobbler`.
   - **Application description**: e.g. `Scrobbles my AzuraCast station`.
   - **Callback URL**: leave empty.
2. Copy the **API key** and **Shared secret** shown after creating it.

## 2. Configure

```bash
cp .env.example .env
```

Edit `.env`:

```ini
AZURACAST_URL=https://your-azuracast.example.com   # base URL, no trailing slash
STATION_SHORTCODE=                                  # leave empty if you have only one station
LASTFM_API_KEY=your_api_key
LASTFM_API_SECRET=your_shared_secret
LASTFM_SESSION_KEY=                                 # filled by the auth step below
POLL_INTERVAL_SECONDS=15
SCROBBLE_ENABLED=true
LOG_LEVEL=info
```

## 3. Find your station shortcode

```bash
npm run diagnose
```

This lists every public station with its `shortcode` and current track, and
verifies your Last.fm credentials. Put the shortcode in `STATION_SHORTCODE`.

## 4. Authorize Last.fm (get the session key)

```bash
npm run auth
```

It prints a URL like `https://www.last.fm/api/auth/?api_key=...&token=...`.
Open it, click **Yes, allow access**, come back and press ENTER. The
`LASTFM_SESSION_KEY` is written to your `.env` automatically.

## 5. Run it

```bash
npm start
```

You should see the current track and `Now playing:` / `Scrobble:` lines.

---

## Deployment

### Docker

```bash
docker compose up -d --build
docker logs -f azuracast-lastfm
```

`restart: unless-stopped` keeps it running across reboots.

### systemd

A ready-to-edit unit is included at `deploy/azuracast-lastfm.service`. Copy the
project to `/opt/azuracast-lastfm`, then:

```bash
sudo cp deploy/azuracast-lastfm.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now azuracast-lastfm
journalctl -u azuracast-lastfm -f
```

---

## Configuration reference

| Variable | Default | Description |
| --- | --- | --- |
| `AZURACAST_URL` | — | AzuraCast base URL (no trailing slash). |
| `STATION_SHORTCODE` | — | Station shortcode or numeric id. Optional if there is only one station. |
| `LASTFM_API_KEY` | — | Last.fm application API key. |
| `LASTFM_API_SECRET` | — | Last.fm application shared secret. |
| `LASTFM_SESSION_KEY` | — | Session key obtained with `npm run auth`. |
| `POLL_INTERVAL_SECONDS` | `15` | How often to check the station. |
| `REQUEST_TIMEOUT_SECONDS` | `15` | HTTP timeout for API calls. |
| `SCROBBLE_ENABLED` | `true` | `false` = only log what's playing, never submit to Last.fm. |
| `LOG_LEVEL` | `info` | `info` or `debug`. |

---

## Scripts

| Command | Description |
| --- | --- |
| `npm start` | Run the scrobbler. |
| `npm run diagnose` | List stations/shortcodes and verify Last.fm credentials. |
| `npm run auth` | Interactive Last.fm authorization → saves the session key. |

---

## Notes & caveats

- This mirrors the **station**, not your speakers: it scrobbles what the station
  plays even if you are not actively listening.
- Last.fm's terms require that you are allowed to scrobble the content. Only use
  this with a station/account you own or have permission to use.
- When the station goes offline the current track is flushed (scrobbled) and the
  tool resumes automatically.
- This is a community tool and is not affiliated with AzuraCast or Last.fm.

---

## 🇪🇸 Español

Conector en Node.js (sin dependencias) que lleva a tu perfil de **Last.fm** lo que
suena en tu emisora **[AzuraCast](https://www.azuracast.com/)**: actualiza el
*«Escuchando ahora»* y hace *scrobble* de cada tema, como si estuvieras escuchando
la radio.

AzuraCast no incluye scrobbling nativo de Last.fm (su integración con Last.fm solo
sirve para carátulas), así que esta herramienta lo resuelve desde fuera: lee la API
pública *Now Playing* de la emisora y usa la API oficial de Last.fm
(`track.updateNowPlaying` y `track.scrobble`).

### Requisitos

- **Node.js 18.17+** (no hace falta `npm install`: no hay dependencias).
- Cuenta de Last.fm con **API key** y **shared secret**.
- **URL base** y **shortcode** de tu emisora AzuraCast.

### Puesta en marcha

1. **Crea una app en Last.fm** en <https://www.last.fm/api/account/create>
   (deja la *Callback URL* vacía) y copia la **API key** y el **Shared secret**.

2. **Configura**:
   ```bash
   cp .env.example .env
   ```
   Rellena `AZURACAST_URL`, `LASTFM_API_KEY` y `LASTFM_API_SECRET`.

3. **Saca el shortcode de la emisora** y comprueba Last.fm:
   ```bash
   npm run diagnose
   ```
   Copia el `shortcode` en `STATION_SHORTCODE` del `.env`.

4. **Autoriza Last.fm** (solo la primera vez):
   ```bash
   npm run auth
   ```
   Abre la URL que imprime, pulsa **Yes, allow access** y vuelve a pulsar ENTER.
   La `LASTFM_SESSION_KEY` se guarda sola en el `.env`.

5. **Arranca**:
   ```bash
   npm start
   ```

### Despliegue

**Docker**
```bash
docker compose up -d --build
docker logs -f azuracast-lastfm
```

**systemd** — usa la unidad incluida en `deploy/azuracast-lastfm.service`:

```bash
sudo cp deploy/azuracast-lastfm.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now azuracast-lastfm
journalctl -u azuracast-lastfm -f
```

### Configuración

| Variable | Por defecto | Descripción |
| --- | --- | --- |
| `AZURACAST_URL` | — | URL base de AzuraCast (sin barra final). |
| `STATION_SHORTCODE` | — | Shortcode o id de la emisora. Opcional si solo tienes una. |
| `LASTFM_API_KEY` | — | API key de tu app de Last.fm. |
| `LASTFM_API_SECRET` | — | Shared secret de tu app de Last.fm. |
| `LASTFM_SESSION_KEY` | — | Session key obtenida con `npm run auth`. |
| `POLL_INTERVAL_SECONDS` | `15` | Cada cuántos segundos consultar la emisora. |
| `REQUEST_TIMEOUT_SECONDS` | `15` | Timeout HTTP de las llamadas. |
| `SCROBBLE_ENABLED` | `true` | `false` = solo registra por consola, sin enviar a Last.fm. |
| `LOG_LEVEL` | `info` | `info` o `debug`. |

### Comandos

| Comando | Descripción |
| --- | --- |
| `npm start` | Ejecuta el scrobbler. |
| `npm run diagnose` | Lista emisoras/shortcodes y verifica las credenciales de Last.fm. |
| `npm run auth` | Autorización de Last.fm → guarda la session key en `.env`. |

### Notas

- Espeja la **emisora**, no tus altavoces: hace *scrobble* de lo que suena aunque
  no estés escuchando en ese momento.
- Cuando la emisora se detiene, hace *flush* del tema actual y se reanuda solo.
- Omite temas de menos de 30 segundos y evita scrobbles duplicados.
- No está afiliado a AzuraCast ni a Last.fm.

## License

[MIT](LICENSE)

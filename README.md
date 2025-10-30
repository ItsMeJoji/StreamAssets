# StreamAssets

Collection of small overlay tools used by ItsMeJoji for livestreams (Pokémon-themed overlays, parasocial/friendship checkers, and utilities).

This repository contains static HTML/JS/CSS assets located at the repo root (e.g. `parasocial-checker.html`, `friendship-checker.html`) and client-side JavaScript under `assets/js/`.

## Summary
- `parasocial-checker.html` — overlay that shows a user's Pokémon on-screen and allows chat commands / channel point redemptions to reroll or change Pokémon.
- `assets/js/psc.js` — main overlay logic (Twitch chat integration, element creation, and storage integration).
- `pokemonData.json` — local data file used when running the bundled Flask server to persist user Pokémon between sessions.

## Why use the Flask server
- Browsers opened from OBS as a local `file://` source are sandboxed and lose OAuth/URL data on redirect. Running a local server fixes Twitch OAuth redirects and enables persistent storage to disk.
- The server serves static files and exposes a small JSON API used by `psc.js` to read/write `pokemonData.json`.

## Quickstart (recommended — local development / OBS)

1. Install Flask:

```powershell
pip install Flask
```

2. Set up environment variables:

Create a `.env` file in the project root with the following variables:
```
TWITCH_ACCESS_TOKEN=your_access_token
TWITCH_CLIENT_ID=your_client_id
TWITCH_CHANNEL_NAME=your_channel_name
```

You can generate your Twitch access token at https://twitchtokengenerator.com/ . The token needs to have at least chat:read, chat:edit, moderator:read:chatters, channel:read:redemptions permissions. to work correcctly.

3. Start the server (from the project root):

```powershell
python app.py
```

4. Open the overlay in your browser or add it to OBS as a Browser Source:

```
http://localhost:3000/parasocial-checker.html?client_id=YOUR_TWITCH_CLIENT_ID&username=YOUR_TWITCH_NAME
```

## Notes about storage
- When using the Flask server, overlay code will read/write `pokemonData.json` in the repository root. That file is created automatically the first time the server runs.
- If the server is not available, the client falls back to `localStorage` (per-browser, non-shared).

## Twitch OAuth / Redirects
- Make sure your Twitch application redirect URI (in the Twitch Developer Console) matches the URL you use locally, for example `http://localhost:3000/parasocial-checker.html`.
- Do not open the overlay using the `file://` protocol when you rely on OAuth — that will break redirects.

## API endpoints (used by `psc.js`)
- `GET /api/pokemon` — returns all stored user Pokémon JSON
- `GET /api/pokemon/<username>` — returns stored data for a user
- `POST /api/pokemon/<username>` — save/update a user's Pokémon (JSON body)

## Troubleshooting
- If the overlay resets on refresh, confirm `app.py` is running and `pokemonData.json` exists in the project root.
- If you see OAuth redirect loops, ensure your redirect URI in Twitch matches `http://localhost:3000/parasocial-checker.html` and that you're loading the overlay via `http://` (not `file://`).
- For Windows PowerShell script execution issues run this in an elevated PowerShell session (temporary allowance):

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

## Optional: run with a production WSGI server
- For local use Flask's dev server is fine. If you want a production-ready server on Windows, you can use `waitress`:

```powershell
pip install waitress
python -c "from waitress import serve; import app; serve(app.app, host='0.0.0.0', port=3000)"
```

## Contributing / Notes
- This repo includes many static assets and images. If you change behaviour in `psc.js`, test both with and without the local server (the client code has a fallback to `localStorage`).
- Be careful with OAuth access tokens — they are stored temporarily in browser localStorage by the client for authentication and are not uploaded anywhere by the server.


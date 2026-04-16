# StreamAssets

Collection of small stream tools used by ItsMeJoji for livestreams.

## Pages

- Home page with the embedded Friendship Checker
- Friendship Checker overlay
- Stream Schedule Maker
- Stream Docket

The schedule maker page expects a Twitch Client ID and a valid user access token, then either a broadcaster login or broadcaster ID.
Set `VITE_TWITCH_CLIENT_ID` in `.env` before using the schedule maker.
It also includes vertical and horizontal print layouts for exporting the weekly schedule.

For GitHub Pages deploys, set a repository variable named `VITE_TWITCH_CLIENT_ID` so the Vite build can inline it during CI.

## Vite

This repo is set up as a Vite multi-page site.

```bash
npm install
npm run dev
```

Build output goes to `dist/`:

```bash
npm run build
npm run preview
```

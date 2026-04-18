# Usage

## Development

Runs the **Hono** API and **Vite** dev server together; the UI proxies `/api` to the API port.

```bash
cd tools/pi-portal   # or your clone root
npm install
npm run dev
```

- Open the URL **Vite** prints (commonly `http://127.0.0.1:5173`).
- The API listens on **`127.0.0.1:$PI_PORTAL_API_PORT`** (default **8790**). See [Configuration](configuration.md).

Under **Files**, tabs for optional paths (`APPEND_SYSTEM.md`, `AGENT.md`, `workspace.conf`) appear only when that file exists on disk, or after you use **Add optional file** to create one.

## Production (single process)

Build the SPA, then start the server with static serving enabled:

```bash
npm run build
PI_PORTAL_SERVE_STATIC=1 DOT_MI_DIR=/path/to/dot-mi npm start
```

Open `http://127.0.0.1:8790` (or your chosen `PI_PORTAL_API_PORT`).

## npm scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | `tsx watch server.ts` + Vite (concurrent) |
| `npm run build` | Typecheck + Vite production build |
| `npm start` | API + static `dist/` when `PI_PORTAL_SERVE_STATIC=1` |
| `npm run check` | `tsc --noEmit` |

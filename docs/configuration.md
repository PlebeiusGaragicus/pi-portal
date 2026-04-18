# Configuration

Environment variables read by the server and tooling:

| Variable | Description |
|----------|-------------|
| `DOT_MI_DIR` or `DOT_MI_ROOT` | Absolute path to the **dot-mi** repository root (must contain `agents/`, `shared/`, `setup.sh`). If unset, defaults to **two levels above** the pi-portal package directory (so `dot-mi` is resolved when this repo lives at `dot-mi/tools/pi-portal`). |
| `PI_PORTAL_API_PORT` | API listen port (default **8790**). The Vite dev server proxies `/api` to this port. |
| `PI_PORTAL_SERVE_STATIC` | Set to `1` so the Node server serves the built `dist/` SPA as well as `/api` (production-style run). |

Typical development:

```bash
# optional: point at a non-default dot-mi checkout
export DOT_MI_DIR=/path/to/dot-mi
npm run dev
```

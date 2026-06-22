import { defineConfig } from "vite";

// The FastAPI backend (run with `uvicorn main:app --reload`).
const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

// pysigned signs the full URL, including the host:port. We deliberately keep
// `changeOrigin: false` so the backend sees the SAME host the browser used
// (localhost:5173). That way the URL it signs is one the browser can fetch
// back through this proxy and have the signature verify — no CORS, no backend
// changes.
const proxy = Object.fromEntries(
  ["/signed", "/samples", "/openapi.json", "/jwks.json"].map((path) => [
    path,
    { target: BACKEND, changeOrigin: false },
  ]),
);

export default defineConfig({
  server: { port: 5173, proxy },
});

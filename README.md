# pysigned playground

An interactive demo of [**pysigned**](https://github.com/meg-code/pysigned) — signed URLs
that grant time-limited access to protected resources.

The app mints a signed URL on the server, lets you follow it to fetch the protected
resource, and then lets you tamper with the signature and watch verification fail.

> 📚 **Docs:** https://meg-code.github.io/pysigned/

## What it shows

- **`GET /signed`** — the server mints a freshly signed URL to a random resource using
  [`URLAuth`](https://meg-code.github.io/pysigned/).
- **`GET /samples/{resource}`** — the protected route. A
  [`SignedRoute`](https://meg-code.github.io/pysigned/) dependency verifies the `sig` and
  `exp` query params before the handler runs, rejecting any request whose signature is
  missing, tampered, or expired.

The [frontend](frontend/) is a small Vite + TypeScript single-page app that drives both
endpoints so you can mint, follow, and tamper with URLs from the browser.

## Requirements

- Python ≥ 3.13
- [uv](https://docs.astral.sh/uv/) (for the backend)
- Node.js (for building the frontend)

## Running it

Build the frontend, then start the API server:

```sh
# 1. Build the frontend (served from frontend/dist)
cd frontend
npm install
npm run build
cd ..

# 2. Run the FastAPI app
uv run uvicorn main:app --reload
```

Then open http://127.0.0.1:8000.

During frontend development you can run the Vite dev server with `npm run dev` for hot
reloading instead of rebuilding `dist` each time.

## Layout

```
main.py        FastAPI app: minting (/signed) and the protected route (/samples/{resource})
frontend/      Vite + TypeScript playground UI
static/        Sample protected resources
```

## Learn more

- pysigned source: https://github.com/meg-code/pysigned
- pysigned docs: https://meg-code.github.io/pysigned/

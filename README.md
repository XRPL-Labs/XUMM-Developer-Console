# Xaman Developer Console

As running on https://apps.xaman.dev - Documentation: https://docs.xumm.dev

SDK: [![npm version](https://badge.fury.io/js/xumm.svg)](https://www.npmjs.com/xumm)

# Warning

You probably don't want to use this repository, you probably want to visit the ready to use Developer Console at
https://apps.xaman.dev and use the API ([docs](https://docs.xumm.dev)) or SDK ([npm](https://www.npmjs.com/xumm))

## Stack

[Bun](https://bun.sh), Vite, React, TypeScript, Tailwind CSS. Sign in with Xaman (the `xumm` SDK, OAuth2 PKCE).

## Project setup

```
bun install
cp .env.sample .env   # VITE_XUMM_KEY: the API key of the console's own Xaman application
```

### Development (hot reload), on http://localhost:8080

```
bun run dev
```

Against the live Xaman API by default. Another API: `VITE_API_ENDPOINT` (see `.env.sample`).

### Development without a sign in and without the API (mock data, in memory)

```
bun run dev:mock
```

### Type check and build for production (to `dist/`)

```
bun run build
```

`public/_headers` (security headers, Content Security Policy) and `public/_redirects` (single page app) are for the static host.

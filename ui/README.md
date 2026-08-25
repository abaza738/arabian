# UI — Nuxt

The frontend for the Arabian virtual airline site. Fetches content from Strapi and renders it as a static-friendly Vue 3 application.

## Development

```bash
pnpm install

# Local development server
pnpm dev

# Build for production
pnpm build

# Preview production build locally
pnpm preview
```

The CMS must be running before starting the UI (`pnpm dev:cms` from the root).

## Environment Variables

Copy `.env.example` to `.env`:

| Variable                 | Value                                                |
| ------------------------ | ---------------------------------------------------- |
| `NUXT_PUBLIC_STRAPI_URL` | `http://localhost:1337` (local dev)                  |
| `NUXT_STRAPI_URL`        | Unset for local dev (falls back to the same default) |
| `NUXT_PUBLIC_SITE_URL`   | `http://localhost:3000` (local dev)                  |
| `NUXT_SITE_ENV`          | `production`                                         |

`@nuxtjs/strapi` puts its config in `runtimeConfig` **twice** — a private
`strapi.url` and a public `public.strapi.url` — and the two are set by different
variables. `NUXT_STRAPI_URL` drives the server-side client, so it is what every
SSR fetch uses; `NUXT_PUBLIC_STRAPI_URL` drives client-side fetches and
`mediaUrl()`, whose output a browser has to resolve.

Locally they are the same value and only the public one is worth setting. They
diverge under Docker, where the server reaches the CMS at `http://cms:1337` and
a browser cannot — see the root `docker-compose.yml`. Setting only the public
one there leaves SSR pointing at the UI container itself: pages render blank on
load and fill in only after the browser hydrates.

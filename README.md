# Arabian

Website for **Arabian**, a virtual airline: published timetable, fleet, hubs,
route network, crew roster, news and events. Nuxt frontend on a Strapi CMS,
self-hosted with Docker Compose.

## Stack

| Layer    | Technology     |
| -------- | -------------- |
| Frontend | Nuxt 4 (Vue 3) |
| CMS      | Strapi 5       |
| Database | PostgreSQL 17  |
| Proxy    | Caddy          |

pnpm workspace, Node 20–24. `cms/` on port 1337, `ui/` on port 3000.

## Quick start

```bash
cp .env.example .env && cp cms/.env.example cms/.env && cp ui/.env.example ui/.env
# fill in the Strapi secrets: node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"

docker compose up postgres -d
pnpm install
pnpm dev:cms                  # first run: create an admin at localhost:1337/admin
cd cms && pnpm seed:example   # loads cms/data/data.json — content to edit, not an empty admin
pnpm dev:ui                   # separate terminal
```

Site at `http://localhost:3000`, admin at `http://localhost:1337/admin`.

## Scripts

```bash
pnpm dev:cms / dev:ui    # Strapi with auto-reload / Nuxt dev server
pnpm build               # CMS then UI
pnpm format              # Prettier, both packages
pnpm typecheck           # vue-tsc over ui, templates included
```

`pnpm install` points `core.hooksPath` at `.githooks/`; pre-commit runs
`pnpm typecheck` on commits touching `ui/**/*.{ts,vue,json}`. `--no-verify`
skips it.

## Content

Everything editable lives in the CMS: site settings and hero (**Global**,
**Home**), **Aircraft**, **Hub**, **Destination**, **Airport**, **Flight**,
**Pilot**, **Rank**, plus **Article**, **Event**, **Announcement**,
**Document** and **Page** (tick `showInMenu` to put a page in the menu).

The schedule is uploaded, not typed: the **Timetable** single type has a `csv`
media field — upload an export in the shape of `cms/data/flights.example.csv`
and save. The import is all-or-nothing; errors land in `lastImportReport` with
line numbers. Every time is Zulu and `days` is an SSIM digit string
(`"136"` = Mon/Wed/Sat) naming the days a flight *departs*.

Colours, type, spacing and every other design token live in
`ui/app/assets/styles/tokens.css` — no component holds a literal. `--hue-accent`
and `--hue-support` at the top of that file move the whole palette.
`ui/app/components/OgImage/Card.takumi.vue` renders outside a browser and
mirrors four of those colours by hand; it is the one place to update alongside a
rebrand.

## Environment

`.env.example` documents every variable inline. Three are easy to get wrong:

- **`NUXT_STRAPI_URL`** — Strapi as the *ui container* reaches it (`http://cms:1337`
  under Docker). Drives every SSR fetch. Setting only the public one below leaves
  SSR pointed at the ui container itself: pages render blank on reload and fine
  while clicking around.
- **`NUXT_PUBLIC_STRAPI_URL`** — Strapi as a *browser* reaches it. Client fetches
  and every `<img>`. Never `http://cms:1337`.
- **`NUXT_PUBLIC_SITE_URL`** — read at build time as well as runtime, so changing
  it needs `docker compose up -d --build ui`, not a restart.

## Deployment

```bash
docker compose up -d --build
```

Both images build from the repo root (the only pnpm lockfile is there). Compose
waits for Postgres, then Strapi's `/_health`, then starts the UI.

**Postgres, Strapi and the UI publish to `127.0.0.1` only** — a published Docker
port sits ahead of the host firewall, so loopback is what keeps a half-configured
deployment off the internet. Reach them over an SSH tunnel
(`ssh -L 1337:localhost:1337 you@server`).

What faces the world is Caddy, behind the `proxy` Compose profile. It terminates
TLS for two hostnames and gets the certificates itself:

```bash
COMPOSE_PROFILES=proxy
SITE_DOMAIN=example.org          # the Nuxt site
CMS_DOMAIN=cms.example.org       # Strapi API, admin and uploads

NUXT_PUBLIC_SITE_URL=https://example.org
NUXT_PUBLIC_STRAPI_URL=https://cms.example.org
```

Both hostnames are public because the browser talks to both. Point `A` records
at the server and let them resolve *before* starting Caddy (Let's Encrypt
rate-limits failures), and open ports 80 and 443 — 80 carries the ACME challenge.
`docker compose logs caddy` should reach `certificate obtained successfully`.

The images are production builds and cannot hot-reload; develop on the host as
in Quick start.

# Adiga Xasa — Website Template

A reusable, self-hosted website template for **any Xasa (Adiga community council) around the world**. Fork or use this as a GitHub template to spin up a full-featured community website with a content management system in minutes.

## What is a Xasa?

A Xasa (Адыгэ Хасэ) is the traditional Adiga/Circassian community council. Xasa organizations exist across the diaspora — in Turkey, Jordan, Syria, Israel, the US, Germany, and beyond — each independently run but sharing the same cultural mission. This project gives every Xasa a consistent, maintainable web presence without starting from scratch.

## Stack

| Layer    | Technology             |
|----------|------------------------|
| Frontend | Nuxt (Vue 3)           |
| CMS      | Strapi 5               |
| Database | PostgreSQL 17          |
| Runtime  | Docker Compose         |

## Using This Template

This repo is designed to be used as a **GitHub template**. Click **"Use this template"** on GitHub to create a new repository for your Xasa — you get a clean copy with no shared history, fully owned by your organization.

Each Xasa runs its own independent deployment: its own database, its own CMS admin, its own hosting. There is no central server — your data stays with you.

**New here?** [`docs/getting-started.md`](docs/getting-started.md) is the full walkthrough — setup, seeding, branding, the content model, deployment and troubleshooting. The rest of this README is the condensed version.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Node.js](https://nodejs.org/) 20+ and [pnpm](https://pnpm.io/) (for local development)

## Quick Start

```bash
# 1. Copy environment files
cp .env.example .env
cp cms/.env.example cms/.env
cp ui/.env.example ui/.env

# 2. Fill in secrets (see Environment Variables below)

# 3. Start the database
docker compose up postgres -d

# 4. Install dependencies
pnpm install

# 5. Start the CMS (first run will prompt you to create an admin account)
pnpm dev:cms

# 6. Start the frontend (in a separate terminal)
pnpm dev:ui
```

The CMS admin panel is at `http://localhost:1337/admin`.
The website is at `http://localhost:3000`.

## Environment Variables

### Root `.env` (Docker Compose)

| Variable            | Description                          |
|---------------------|--------------------------------------|
| `POSTGRES_DB`       | Database name                        |
| `POSTGRES_USER`     | Database user                        |
| `POSTGRES_PASSWORD` | Database password                    |
| `STRAPI_HOST`       | Strapi bind address (default `0.0.0.0`) |
| `STRAPI_PORT`       | Strapi port (default `1337`)         |
| `UI_PORT`           | Frontend port (default `3000`)       |
| `COMPOSE_PROFILES`  | Set to `proxy` to start Caddy alongside the rest (see [Domains and HTTPS](#domains-and-https)). Unset, nothing listens on a public port |
| `SITE_DOMAIN`       | Hostname the site answers on, e.g. `example.org`. Read by Caddy only |
| `CMS_DOMAIN`        | Hostname the Strapi API and admin answer on, e.g. `cms.example.org`. Read by Caddy only |
| `APP_KEYS`          | Strapi app keys (comma-separated)    |
| `API_TOKEN_SALT`    | Strapi API token salt                |
| `ADMIN_JWT_SECRET`  | Strapi admin JWT secret              |
| `TRANSFER_TOKEN_SALT` | Strapi transfer token salt         |
| `ENCRYPTION_KEY`    | Strapi encryption key                |
| `JWT_SECRET`        | Users-permissions JWT secret. **Required** — Strapi will not boot without it |
| `NUXT_STRAPI_URL`   | Strapi origin as the **ui container** reaches it — drives every SSR fetch. Defaults to `http://cms:1337`; set it only to point at a CMS outside this Compose project |
| `NUXT_PUBLIC_STRAPI_URL` | Strapi origin as a **visitor's browser** reaches it — client-side fetches and every `<img>` (see below) |
| `NUXT_PUBLIC_SITE_URL` | Public origin of this site (see below). Compose passes it to the `ui` image as a **build arg** as well as an env var, so changing it needs a rebuild |
| `NUXT_SITE_ENV`     | `production`, or anything else to serve `Disallow: /` and `noindex` |

Generate secret values with:
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"
```

### `ui/.env`

| Variable                  | Description                                  |
|---------------------------|----------------------------------------------|
| `NUXT_PUBLIC_STRAPI_URL`  | Strapi API origin as a browser resolves it — client-side fetches and every `<img>`. `http://localhost:1337` for local dev, the CMS's public domain in production. **Never `http://cms:1337`**: that name resolves only inside the Compose network, so it would break every image. Under Docker the server side is configured separately, by `NUXT_STRAPI_URL` |
| `NUXT_STRAPI_URL`         | Strapi API origin as *this process* reaches it — every server-rendered fetch. Unset for local dev, where it falls back to the same default |
| `NUXT_PUBLIC_SITE_URL`    | Public origin of this site — canonical URLs, `hreflang` links, sitemap. **Read at build time as well as at runtime** (`i18n.baseUrl`), so it must be present when `pnpm build:ui` runs, and each environment gets its own build |
| `NUXT_SITE_ENV`           | `production`, or anything else to serve `Disallow: /` and `noindex` (set to `staging` on the staging instance) |

## Development

```bash
pnpm dev:cms    # Start Strapi with auto-reload
pnpm dev:ui     # Start Nuxt dev server

pnpm build      # Build both CMS and UI for production
pnpm format     # Prettier, both packages
pnpm typecheck  # vue-tsc over the frontend, templates included
```

`pnpm install` points `core.hooksPath` at `.githooks/`, where a **pre-commit hook runs `pnpm typecheck`** on any commit that touches `ui/**/*.{ts,vue,json}` — other commits skip it and are instant. `git commit --no-verify` bypasses it.

See [cms/README.md](cms/README.md) and [ui/README.md](ui/README.md) for package-specific details.

## Deployment

Fill in the root `.env`, then:

```bash
docker compose up -d --build
```

Both services build from their respective `Dockerfile`s, whose **build context is the repo root** — this is a pnpm workspace and the only lockfile lives there. Compose waits for Postgres, then for Strapi's `/_health`, before starting the UI.

`NUXT_PUBLIC_SITE_URL` is compiled into the UI bundle, so changing it needs a rebuild rather than a restart:

```bash
docker compose up -d --build ui
```

### Domains and HTTPS

**Postgres, Strapi and the UI all publish to `127.0.0.1` only.** A published
Docker port is inserted ahead of `ufw`/`firewalld`, so a container bound to
`0.0.0.0` is on the internet whatever the firewall says — binding to loopback is
what keeps an unfinished deployment private. Reach them from your laptop with an
SSH tunnel (`ssh -L 1337:localhost:1337 you@server`), not by opening a port.

What faces the world is **Caddy**, in the same Compose file behind the `proxy`
profile. It terminates TLS for two hostnames and obtains the certificates
itself — no certbot, no renewal cron:

| Hostname | Serves |
| --- | --- |
| `SITE_DOMAIN` | The Nuxt site |
| `CMS_DOMAIN` | The Strapi API, admin and uploaded files |

Both are public because a visitor's browser talks to *both*: every `<img>` on
the site resolves against `NUXT_PUBLIC_STRAPI_URL`.

1. Point `A` records for both hostnames at the server, and **wait for them to
   resolve**. Caddy requests a certificate on boot, and Let's Encrypt rate-limits
   repeated failures.
2. Open ports **80 and 443** on the host firewall. 80 is not optional — it
   carries the ACME challenge and the redirect to HTTPS.
3. In the root `.env`, set the hostnames, switch the profile on, and give the app
   its public origins:

   ```bash
   COMPOSE_PROFILES=proxy
   SITE_DOMAIN=example.org
   CMS_DOMAIN=cms.example.org

   NUXT_PUBLIC_SITE_URL=https://example.org
   NUXT_PUBLIC_STRAPI_URL=https://cms.example.org
   ```

   Leave `NUXT_STRAPI_URL` alone: server-side rendering keeps talking to
   `http://cms:1337` across the Compose network, never out through the proxy.
4. Rebuild and start. The rebuild is required, not housekeeping —
   `NUXT_PUBLIC_SITE_URL` is compiled into the bundle:

   ```bash
   docker compose up -d --build
   ```

`docker compose logs caddy` should reach `certificate obtained successfully`
within a few seconds of DNS being correct; until then it retries in the
background and serves the request over a self-signed certificate the browser
rejects.

To answer on `www` as well, add it to the first block of the `Caddyfile` —
`{$SITE_DOMAIN}, www.example.org { … }`. Serving both the site and the CMS from
a single hostname under different paths is possible but is not what this file
does: Strapi then needs its own `server.url`, and the `/admin`, `/api`,
`/uploads` and `/i18n` prefixes all have to be routed by hand.

If Strapi ever emits an `http://` link (password-reset mail, some admin
redirects), that is Koa not trusting the proxy's `X-Forwarded-Proto` — set
`proxy` in `cms/config/server.ts`. Don't add it pre-emptively; most deployments
never hit it.

There is no containerised dev loop — the images are production builds and cannot hot-reload. Develop on the host with `docker compose up postgres -d` plus `pnpm dev:cms` / `pnpm dev:ui`, as in Quick Start.

## Customizing for Your Xasa

Almost nothing here needs a developer. The site name, wordmark, logo, favicon,
hero, statistics, call-to-action cards, social links, footer links and contact
details are all fields on the **Global** single type in the Strapi admin — edit
them there, not in the code. The only thing that genuinely lives in the repo is
the look, and that is one file: `ui/app/assets/styles/tokens.css`.

### 1. Seed, then edit

`cd cms && pnpm seed:example` loads `cms/data/data.json` on a first run and
gives you a complete, working site to edit rather than an empty admin. It is
idempotent — it refuses to run twice. To start over on an existing database:

```bash
cd cms
pnpm seed:reset     # wipes seeded content, keeps admin users and uploads
pnpm seed:example
```

### 2. Add your photographs

The seed ships **no photographs**, because nobody else's belong in your site.
`data.json` already names the files it expects; drop them into
`cms/data/uploads/` and re-seed, and they are picked up with no edit to any file.
A name with nothing behind it is not an error — every image slot has a designed
placeholder, so the site works with none of these and improves as you add them.

| File | Shape | Where it shows |
| --- | --- | --- |
| `hero-background.jpg` | ≥2400×1400, low detail | The landing hero. The single biggest change |
| `hero-decoration.png` | ~300×300, transparent | Ornament in the hero corner; hidden on small screens |
| `article-*.jpg` | 1600×1000 | Article covers — cropped 2:1, 5:2 and 4:3, so allow headroom |
| `event-*.jpg` | 1600×900 | Event covers |
| `branch-*.jpg` | 1600×700 | Branch pages |
| `programme-*.jpg` | 1600×1000 | Programme cards and detail pages |
| `person-*.jpg` | 600×600 square | Board portraits, shown as 72px circles |

Replace `logo.svg` and `favicon.svg` with your own mark — the ones that ship are
deliberately neutral placeholders, not any association's crest. The three
`document-*.pdf` files are placeholders too: swap in your real bylaws, annual
report and membership form.

### 3. Write your own content

Edit `cms/data/data.json` before the first seed, or edit in the admin after it.
The content types are:

| Type | What it holds |
| --- | --- |
| **Global**, **About** | Site settings; the association's story, history and SEO |
| **Article** + Category | News, with an author and an optional branch |
| **Event** | Dated events, with a venue, status and registration link |
| **Announcement** | Short notices: condolences, congratulations, urgent notices. Can expire and can be pinned |
| **Programme** | What the association runs — classes, committees, ensembles, funds |
| **Person** | The board, past presidents, committee leads and article authors. `termEnd` empty means currently serving |
| **Document** | Downloadable files: bylaws, reports, forms |
| **Branch** | Local chapters. Articles, events, people and programmes can each be scoped to one |
| **Page** | Any standalone page. Tick **showInMenu** and it appears in the site menu — no developer needed |

Everything is translatable. The languages the site offers are the `LOCALES`
array in `ui/shared/utils/locales.ts`. The template ships English and Arabic;
`ady` (West Circassian) and `kbd` (Kabardian) have message files and seed
content but no translations, so their entries are commented out.

### 4. Make it look like yours

Every colour, size, weight, radius, shadow and spacing step on the site is
declared in **`ui/app/assets/styles/tokens.css`**, and nowhere else. No
component contains a hex code or a pixel value. To restyle the template you
edit that one file.

**The palette follows two numbers.** At the top of the file:

```css
--hue-accent: 145;   /* the green: buttons, links, the hero field */
--hue-support: 85;   /* the gold: rules, dots, accents on the hero */
```

They are hues in degrees — `0` red, `145` green, `250` blue. Change them and
every accent surface on the site moves together, in step, still legible,
because only the hue moves and not the lightness that makes text readable on
it. Try one and reload before you touch anything else.

Two sets of colours deliberately do *not* follow, and both say so in the file:
the five **category pill** colours, which exist to tell News from Culture from
Events at a glance, and the amber/red **notice** colours, which mean what they
mean regardless of your brand.

**Fonts** are `--font-sans` and `--font-serif` in the same file. If you ship
your own faces, add the `@font-face` rules next to the existing ones in
`main.css`.

One file is exempt and must be edited alongside a rebrand:
`ui/app/components/OgImage/Card.takumi.vue`, the social share card. It renders
outside a browser, where CSS variables do not resolve, so its four colours are
written out by hand. A comment at the top names the tokens they mirror.

### 5. Point it at your domain

Set `NUXT_PUBLIC_SITE_URL`, `NUXT_PUBLIC_STRAPI_URL` and — if your CMS is not
the `cms` service in this Compose project — `NUXT_STRAPI_URL` for your host. See
[Environment Variables](#environment-variables).

The DNS records, the certificates and the two hostnames the site needs are in
[Domains and HTTPS](#domains-and-https).

## Contributing

Bug fixes and improvements that benefit all Xasa organizations are welcome. Open an issue or pull request on the upstream template repository.

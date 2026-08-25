# Getting Started — Running Your Own Xasa Website

Everything needed to take this template from a fresh clone to a live,
bilingual website for your own Xasa.

You do not need to be a developer to run the site day to day. You do need
someone comfortable with a terminal for the first hour, and again on the day
you deploy. After that, everything an editor touches — the site name, the
hero, the news, the board, the menu — is a field in the CMS admin.

**Contents**

1. [Before you start](#1-before-you-start)
2. [Create your repository](#2-create-your-repository)
3. [Configure the environment](#3-configure-the-environment)
4. [Start the database](#4-start-the-database)
5. [Install and start the CMS](#5-install-and-start-the-cms)
6. [Seed — do not skip this](#6-seed--do-not-skip-this)
7. [Start the website](#7-start-the-website)
8. [Make it yours](#8-make-it-yours)
9. [The content model](#9-the-content-model)
10. [Authoring: `data.json` or the admin](#10-authoring-datajson-or-the-admin)
11. [Going live](#11-going-live)
12. [Troubleshooting](#12-troubleshooting)
13. [Day to day](#13-day-to-day)

---

## 1. Before you start

### What you get

A complete community-council website: a landing page with a hero and
statistics, news with categories and bylines, events, announcements,
programmes, a downloadable-documents shelf, a board directory, branch pages,
an About page and editor-created standalone pages — all of it translatable,
with English and Arabic (RTL) working end to end.

Behind it: **Strapi 5** as the CMS on port `1337`, **Nuxt 4** as the website on
port `3000`, **PostgreSQL 17** as the database.

Every Xasa runs its own copy. There is no central server, no shared database
and no account to register. Your content is yours.

### What you need installed

| Tool | Version | Why |
| --- | --- | --- |
| [Node.js](https://nodejs.org/) | `>=20` and `<=24` | Runs both packages. Node 25+ is rejected by `cms/package.json`'s `engines`. |
| [pnpm](https://pnpm.io/) | 9 or newer | This is a pnpm workspace. `npm install` will not work. |
| [Docker](https://docs.docker.com/get-docker/) + Compose | any current | Runs PostgreSQL. Optional if you already have a Postgres 17 server. |
| Git | any | |

The quickest way to get pnpm is Corepack, which ships with Node:

```bash
corepack enable
```

### Decisions worth making now

None of these are permanent, but changing them later means re-seeding or
re-editing content, so a few minutes here saves an hour later.

- **Your domain.** Needed at deploy time, not before.
- **Which languages you will actually publish.** The template ships English and
  Arabic with real content; `ady` (West Circassian) and `kbd` (Kabardian) have
  message files and seed content but no translations. Adding or removing one is
  an edit to your repository and a rebuild, not an admin setting — see
  [§8.4](#84-languages).
- **Whether you have branches.** One branch, or none, and the nav stays simple.
  Two or more and a branch row appears under the main bar automatically.
- **Your two brand hues.** The entire palette derives from two numbers. See
  [§8.3](#83-colours-and-type).

---

## 2. Create your repository

On GitHub, open the template repository and click **Use this template →
Create a new repository**. You get a clean copy with no shared history, owned
by your organization.

```bash
git clone https://github.com/<your-org>/<your-repo>.git
cd <your-repo>
```

Cloning or forking works too. "Use this template" is preferred because it
leaves you free to commit your own content and branding without carrying the
upstream history.

---

## 3. Configure the environment

Three example files, three copies:

```bash
cp .env.example .env
cp cms/.env.example cms/.env
cp ui/.env.example ui/.env
```

### Which file is read when

This trips people up, so it is worth being precise:

| When you run | Reads |
| --- | --- |
| `docker compose up postgres` | root `.env` |
| `pnpm dev:cms` / `pnpm seed:example` | `cms/.env` |
| `pnpm dev:ui` | `ui/.env` |
| `docker compose up` (all three services) | root `.env` only |

In Docker, `cms/.env` and `ui/.env` are **never used** — the root
`.dockerignore` excludes every `.env` file from the build context, so none of
them reach an image. The container gets its settings from
the `environment:` blocks in `docker-compose.yml`, which read the root `.env`.
So the root `.env` and `cms/.env` end up holding the same secrets. That is
expected.

### Generate the secrets

Strapi refuses to start without them. Generate a full set at once:

```bash
node -e "const r=()=>require('crypto').randomBytes(16).toString('base64'); console.log('APP_KEYS='+r()+','+r()); for (const k of ['API_TOKEN_SALT','ADMIN_JWT_SECRET','TRANSFER_TOKEN_SALT','JWT_SECRET','ENCRYPTION_KEY']) console.log(k+'='+r())"
```

Paste the output into **both** the root `.env` and `cms/.env`. `APP_KEYS` is a
comma-separated list — keep both values.

> **Never commit these.** `.env` and `.env.*` are gitignored (with
> `.env.example` deliberately un-ignored). If you paste a secret into a
> screenshot, an issue or a chat, rotate it.

### Fill in the rest

**Root `.env`** — the database and the ports Docker uses:

| Variable | Set it to |
| --- | --- |
| `POSTGRES_DB` | e.g. `xasa` |
| `POSTGRES_USER` | e.g. `xasa` |
| `POSTGRES_PASSWORD` | anything long |
| `STRAPI_HOST` / `STRAPI_PORT` | leave `0.0.0.0` / `1337` |
| `UI_PORT` | leave `3000` |
| `NUXT_STRAPI_URL` / `NUXT_PUBLIC_STRAPI_URL` / `NUXT_PUBLIC_SITE_URL` / `NUXT_SITE_ENV` | leave the `.env.example` defaults for now — they matter only once you run the `cms`/`ui` containers, and [§11](#11-going-live) covers them |

**`cms/.env`** — the same database, seen from your machine:

```dotenv
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=xasa        # must match POSTGRES_DB
DATABASE_USERNAME=xasa    # must match POSTGRES_USER
DATABASE_PASSWORD=…       # must match POSTGRES_PASSWORD
DATABASE_SSL=false
```

> If `DATABASE_CLIENT` is left unset, Strapi silently falls back to SQLite at
> `cms/.tmp/data.db`. Everything appears to work, and then your content is not
> where you think it is. Set it explicitly.

**`ui/.env`** — the defaults are correct for local development:

```dotenv
NUXT_PUBLIC_STRAPI_URL=http://localhost:1337
NUXT_PUBLIC_SITE_URL=http://localhost:3000
NUXT_SITE_ENV=production
```

> `NUXT_PUBLIC_SITE_URL` is read **at build time as well as at runtime** —
> `i18n.baseUrl` in `nuxt.config.ts` uses it to make `hreflang` links
> fully-qualified, and `nuxt.config.ts` is evaluated by `nuxt build`. It has to
> be set before you build, not only before you start the server, and a build
> that lacked it warns `I18n baseUrl is required to generate valid SEO tag
> links.` on every render. See [§11](#11-self-hosting) for what that means when
> you deploy.

---

## 4. Start the database

```bash
docker compose up postgres -d
```

Naming `postgres` is what keeps `cms` and `ui` down; they stay down until you
deploy ([§11](#11-going-live)). Data lives in the named volume `postgres_data`,
so stopping the container does not lose it. The port is published on
`127.0.0.1` only — reachable from your machine, not from the network.

Already have a Postgres 17 elsewhere? Skip this and point `cms/.env` at it. For
a hosted database (Neon, Supabase, Render), use the connection string form
instead:

```dotenv
DATABASE_CLIENT=postgres
DATABASE_URL=postgres://user:password@host:5432/dbname
DATABASE_SSL=true
```

MySQL and SQLite are also supported by `cms/config/database.ts`, but Postgres
is what the project is developed and deployed against.

---

## 5. Install and start the CMS

```bash
pnpm install
pnpm dev:cms
```

The first run builds the Strapi admin panel and creates the database schema.
It takes a couple of minutes. When it finishes, open:

**http://localhost:1337/admin**

Create your administrator account. This account is local to your installation —
it is not registered anywhere.

Leave this terminal running.

---

## 6. Seed — do not skip this

In a second terminal:

```bash
cd cms
pnpm seed:example
```

It must be run from inside `cms/` — the script resolves `data/uploads`
relative to the working directory. It boots its own Strapi instance without
binding the port, so it is safe to run while `pnpm dev:cms` is up.

**The seed does three separate things, and only one of them is about example
content:**

1. **It grants the public API permissions.** Strapi ships with everything
   locked. The seed gives the Public role `find` and `findOne` on all eleven
   content types. **Without this, every request from the website returns 403
   and your site renders completely empty.**
2. **It creates the locales.** `ar`, `ady` and `kbd` are added to Strapi's i18n
   plugin (`en` already exists as the default). Until it runs, Strapi knows
   only English and no translation can be entered.
3. **It imports the example content** from `cms/data/data.json` — a working
   bilingual site to edit, rather than an empty admin to stare at.

The seed refuses to run twice. It records an `initHasRun` flag on first
success; a second run just prints "Seed data has already been imported."

### If you would rather not have example content

You still need steps 1 and 2. Either edit `cms/data/data.json` down to what you
want *before* seeding (see [§10](#10-authoring-datajson-or-the-admin)), or do
the two setup steps by hand in the admin:

- **Settings → Users & Permissions → Roles → Public** — tick `find` and
  `findOne` for Article, Category, Person, Event, Announcement, Programme,
  Document, Global, About, Branch and Page. Save.
- **Settings → Internationalization → Add new locale** — add each language you
  intend to publish, using the same code the frontend uses (`ar` for the
  template as it ships). This is the CMS half only: a language that is not in
  `LOCALES` is not reachable, however much content you translate into it. See
  [§8.4](#84-languages).

Editing `data.json` is far less error-prone than clicking through both lists.

### Starting over

```bash
cd cms
pnpm seed:reset      # wipes seeded content and API permissions, clears the flag
pnpm seed:example    # re-imports
```

`seed:reset` deletes every article, event, announcement, programme, document,
page, person, branch, category and both single types, plus all `api::`
permissions. It **keeps** your admin users and your uploaded files. It refuses
to run when `NODE_ENV=production` unless you also pass `RESET_SEED_CONFIRM=yes`
— a deliberate guard, because against a live Xasa this is unrecoverable
without a backup.

---

## 7. Start the website

In a third terminal, from the repository root:

```bash
pnpm dev:ui
```

**http://localhost:3000**

You should see a complete site: hero, statistics, featured news, events,
announcements, programmes, the board and the footer. Images will be
placeholders until you add your own photographs — that is by design, not a
failure.

Switch to Arabic with the language control in the top bar and confirm the
layout flips to RTL.

At this point you have a working Xasa website. Everything that follows is
making it yours.

---

## 8. Make it yours

The order below is the order of visible impact. Almost none of it is code.

### 8.1 Content first: the Global settings

Open **http://localhost:1337/admin → Content Manager → Global**. This single
type is your site's identity, and it is where most "how do I change…"
questions end:

| Field | What it controls |
| --- | --- |
| `siteName`, `wordmarkSub` | The wordmark in the top bar |
| `siteDescription`, `defaultSeo` | Search-engine title and description |
| `logo`, `favicon` | The mark in the bar and the browser tab |
| `hero`, `heroBackground`, `heroDecoration` | The landing page's opening screen |
| `ribbonTagline`, `aboutSummary`, `location` | Landing page copy |
| `stats` | The numbers strip — members, branches, years |
| `ctaCards` | The call-to-action cards (join, donate, contact) |
| `featuredArticle`, `spotlightArticle` | Which two articles the landing page leads with |
| `socialLinks`, `footerLinks` | The footer |
| `contactEmail`, `contactPhone`, `contactAddress` | Contact details |
| `showUnassignedInBranchViews` | Whether content with no branch shows on branch pages |

Do this in **each** language you publish. Use the locale switcher at the top
right of the Content Manager.

Some fields are shared across all languages on purpose — the logo, the favicon,
the hero images, the social links. Editing them in Arabic edits them
everywhere. That is intended: a photograph is not a translation.

Then edit **About** the same way — your association's story, its history
milestones and its SEO.

### 8.2 Photographs

The template ships **no photographs**, because nobody else's belong on your
site. `data.json` already names the files it expects. Drop them into
`cms/data/uploads/` before seeding and they are picked up with no edit to any
file. A name with no file behind it is skipped, not an error — every image slot
in the UI has a designed placeholder.

| File | Size | Where it shows |
| --- | --- | --- |
| `hero-background.jpg` | ≥2400×1400, low detail | The landing hero. The single biggest change you can make |
| `hero-decoration.png` | ~300×300, transparent | Ornament in the hero corner; hidden on phones |
| `article-*.jpg` | 1600×1000 | Article covers — cropped 2:1, 5:2 and 4:3, so leave headroom |
| `event-*.jpg` | 1600×900 | Event covers |
| `branch-*.jpg` | 1600×700 | Branch pages |
| `programme-*.jpg` | 1600×1000 | Programme cards and detail pages |
| `person-*.jpg` | 600×600 square | Board portraits, shown as 72px circles |

Already seeded? Upload through the admin's Media Library instead and attach
the images to entries by hand — or `pnpm seed:reset && pnpm seed:example` if
you have not written anything yet.

Replace `cms/data/uploads/logo.svg` and `favicon.svg` with your own mark. The
ones that ship are deliberately neutral placeholders, not any association's
crest. The three `document-*.pdf` files are placeholders too — swap in your
real bylaws, annual report and membership form.

### 8.3 Colours and type

**Every** colour, size, weight, radius, shadow and spacing step on the site is
declared in one file:

```
ui/app/assets/styles/tokens.css
```

No component contains a hex code or a pixel value. To restyle the template you
edit that file and nothing else.

The palette follows two numbers, at the top of the file:

```css
--hue-accent: 145;   /* the green: buttons, links, the hero field */
--hue-support: 85;   /* the gold: rules, dots, hero accents */
```

They are hues in degrees — `0` red, `145` green, `250` blue. Change one, reload,
and every accent surface moves together and stays legible, because only the hue
moves; the lightness that makes text readable on each surface stays put. Try
this before you touch anything else.

Two sets of colours deliberately do **not** follow the brand, and both say so
in the file:

- The five **category pill** colours, which exist to tell News from Culture
  from Events at a glance. Collapse them into the accent and they stop doing
  their job. Which of the five a category wears is picked per category in the
  admin (`color`), so adding a category is an editor's job, not a code change.
- The amber and red **notice** colours, which mean what they mean regardless of
  your brand.

**Fonts** are `--font-sans` and `--font-serif` in the same file. The site loads
Playfair Display and IBM Plex Sans from Google Fonts via `ui/nuxt.config.ts`.
If you ship your own faces, add the `@font-face` rules next to the existing
ones in `ui/app/assets/styles/main.css`.

One file is exempt from the tokens rule and must be edited alongside a
rebrand: **`ui/app/components/OgImage/Card.takumi.vue`**, the social share
card. It renders outside a browser, where CSS custom properties do not resolve,
so its four ink colours are written out by hand. A comment at the top names the
tokens they mirror.

### 8.4 Languages

> **Adding or removing a language is a change to your repository, not a setting
> in the admin.** You edit one file and rebuild the frontend. Adding the locale
> in Strapi is only half of it, and on its own does nothing a reader can see.
>
> This is not a limitation of the template. `@nuxtjs/i18n` resolves languages at
> **build** time: the per-language routes (`/de/news`), the bundled interface
> strings and the `hreflang` cluster are all compiled into the output. There is
> no runtime switch that can add one. You already rebuild for
> `NUXT_PUBLIC_SITE_URL` ([§11](#11-going-live)), so this costs you nothing
> extra.

Two layers, and both need to know about a language:

**Interface strings** — the words the template itself supplies ("Load more",
"Upcoming", "Read more") live in `ui/i18n/locales/*.json`. These are yours, in
the repo; the CMS does not hold them.

**Content** — everything else, entered per locale in the CMS.

`LOCALES` in **`ui/shared/utils/locales.ts`** is the whole language
configuration:

```ts
export const LOCALES = [
  { code: 'en', name: 'English', short: 'EN', language: 'en', dir: 'ltr', file: 'en.json' },
  { code: 'ar', name: 'العربية', short: 'عر', language: 'ar', dir: 'rtl', file: 'ar.json' },
] as const satisfies /* … */

export type AppLocale = (typeof LOCALES)[number]['code']
```

`nuxt.config.ts` spreads `LOCALES` into `i18n.locales` rather than keeping its
own copy, and `AppLocale` — the type every Strapi query's `locale` is checked
against — is *derived* from the same array. So there is exactly one place to
edit and nothing that can fall out of step: the array is the set of languages
the site has, and the type widens with it. Never write a language code into a
type by hand.

The template ships English and Arabic. West Circassian (`ady`) and Kabardian
(`kbd`) have message files and seed content but no translations, so their
entries are commented out.

**To add a language** (German, say):

1. Add its entry to `LOCALES`. `code` must match the locale you create in
   Strapi — it is what the frontend sends as the `locale` query parameter on
   every API call. Set `dir: 'rtl'` if it is a right-to-left script.
2. Copy `ui/i18n/locales/en.json` to `de.json` and translate it.
3. Add the locale in the admin under **Settings → Internationalization**.
4. Rebuild the frontend.

Do that once the language is actually translated. A language in `LOCALES` is
offered in the switcher, published in the sitemap and submitted to search
engines; until someone has translated it, every URL under it serves the English
fallback under a German label.

**To drop one**, reverse it: remove the entry, delete the message file, and
remove its translation block from `cms/data/data.json` before seeding.

---

## 9. The content model

### The types

| Type | Kind | What it holds |
| --- | --- | --- |
| **Global** | single | Site settings — see [§8.1](#81-content-first-the-global-settings) |
| **About** | single | The association's story, `history` milestones, SEO |
| **Article** | collection | News. `title`, `description`, `cover`, `blocks`, plus an `author`, a `category` and an optional `branch` |
| **Category** | collection | News categories. `name`, `slug`, `description`, and `color` — which of the pill colours it wears. Add as many as you like; a category with no colour set is grey |
| **Event** | collection | `startsAt` / `endsAt`, `location`, `registrationUrl`, `featured`, and `eventStatus` — `scheduled`, `postponed` or `cancelled` |
| **Announcement** | collection | Short notices. `kind` is `notice`, `condolence`, `congratulation` or `urgent`; `pinned` holds it at the top; `expiresAt` retires it |
| **Programme** | collection | What the association runs. `kind` is `programme`, `committee`, `club` or `fund`; has a `schedule`, a `lead` and an `order` |
| **Person** | collection | The board, past presidents, committee leads and article bylines |
| **Document** | collection | Downloadable files. `category` is `bylaws`, `report`, `financial`, `form` or `other` |
| **Branch** | collection | Local chapters, with their own contact details and cover |
| **Page** | collection | Any standalone page an editor needs |

### Rules that will bite you if you do not know them

**There is no Author type.** Authors are `Person` entries. One directory covers
the board, past presidents, committee leads and article bylines.

**`termEnd` is the whole current-versus-past mechanism.** A person with a
`termStart` and an empty `termEnd` is currently serving. Fill in `termEnd` and
they move to the past-leadership list. A person with **no** `termStart` at all
is a contributor — they can carry an article byline and appear in neither list.
That is how you add a writer without putting them on the board.

**A Page is only reachable if you tick `showInMenu`.** The menu's last column is
the Page collection filtered on `showInMenu` and ordered by `menuOrder`. Untick
it and the page exists at its URL but nothing on the site links to it. Adding a
destination to the site menu is therefore a CMS action, not a code change.

**Relations are held per language.** When you create the Arabic version of an
article, Strapi does **not** copy its author, category or branch across from
English. Set them again, or that language renders with no byline, no category
and no branch. The same applies to the editorial picks on Global.

**Draft and publish** is on for Article, Event, Announcement, Programme,
Document and Page — those need an explicit **Publish** before they appear on
the site. It is off for Person, Branch, Category, About and Global — saving
those publishes them.

Unpublished drafts are not readable from the public API even by URL: a
middleware strips the `status` query parameter from unauthenticated requests,
so `?status=draft` cannot be used to read your unpublished work.

**Two or more branches changes the navigation.** With a single branch, or none,
the nav stays as one bar. Add a second and a branch row appears beneath it
automatically.

### Blocks

Articles, events, programmes, pages and About are built from a **dynamic
zone** — you add blocks in whatever order you like:

- **Rich text** — Markdown. Headings, lists, links, bold, quotes.
- **Media** — a single image with a caption.
- **Slider** — several images as a gallery.
- **Quote** — a pull quote with attribution.

This is the main authoring surface. A long article is a stack of rich-text
blocks with a slider in the middle, not one giant field.

### URLs

Time-stamped content is addressed by id, evergreen content by slug:

```
/article/:id          /announcement/:id       /event/:id
/:slug                /branch/:slug           /programme/:slug
/news  /events  /announcements  /programmes  /documents  /about
/branch/:slug/news    /branch/:slug/events
```

Every URL is prefixed by its language: `/en/news`, `/ar/news`.

`Person` and `Document` have no page of their own — people appear on About and
in bylines, documents on the documents shelf.

---

## 10. Authoring: `data.json` or the admin

Two ways to get your own content in, and they suit different situations.

**Edit `cms/data/data.json` before the first seed** when you are starting fresh
and have a lot to enter, or when you want your content in version control. It
is one file, tracked in git on purpose, holding every type keyed by name plus a
`…Translations` map per language. Relations point at each other **by slug** —
never by position or database id:

```json
{
  "articles": [
    {
      "title": "…",
      "slug": "festival-returns",
      "category": "news",          // a category slug
      "author": "nart-hakurate",   // a person slug
      "cover": "article-festival.jpg",
      "blocks": [{ "__component": "shared.rich-text", "body": "## Heading\n\nText." }]
    }
  ],
  "articleTranslations": {
    "ar": {
      "festival-returns": { "title": "…", "description": "…", "blocks": [ … ] }
    }
  }
}
```

Two things about the translation maps, both of which produce confusing errors
if you get them wrong. The seed handles them for you; hand-editing does not
change that, but it explains what you are looking at if a locale fails:

- A translation is keyed by the **default-language slug**, and the slug is
  shared across languages rather than translated.
- Every translation must restate its relations, because a relation does not
  carry over from the default language. Naming a person or category that has no
  version in that language is a hard error, not a silent blank.

Deleting a whole section from `data.json` is safe — the seed treats a missing
key as an empty list.

**Edit in the admin** for everything after the first day. It is the normal way
to run the site, and it is what you hand to a non-technical editor.

The two do not mix well: `data.json` is only read on a first seed, so changing
it later does nothing until you `seed:reset`, which throws away what was typed
into the admin. Pick `data.json` for the initial load, then move to the admin
and stay there.

---

## 11. Going live

### The shape of a deployment

Three processes: PostgreSQL, Strapi, Nuxt. Strapi must be up before Nuxt
starts. Put a reverse proxy with HTTPS in front — the Strapi admin panel is a
login form and must not be served over plain HTTP.

`docker-compose.yml` runs all three. Fill in the root `.env` first — including
the `NUXT_*` variables — then:

```bash
docker compose up -d --build
```

Compose waits for Postgres to pass `pg_isready` before starting Strapi, and for
Strapi to answer `/_health` before starting Nuxt, so a cold `up` comes online in
the right order without a retry loop.

### Two things worth knowing before you build

1. **The build context is the repository root, not `./cms` or `./ui`.** This is
   a pnpm workspace and `pnpm-lock.yaml` exists only at the root, so each
   service sets `context: .` and `dockerfile: cms/Dockerfile`. Building by hand
   means `docker build -f ui/Dockerfile .` from the root — `docker build ./ui`
   fails on the missing lockfile.

2. **The Strapi API needs two URLs, and the `ui` image is per-environment.**
   `NUXT_STRAPI_URL` is the CMS as the container reaches it (`http://cms:1337`,
   the compose default) and drives every server-rendered fetch;
   `NUXT_PUBLIC_STRAPI_URL` is the CMS as a browser reaches it, used for
   client-side fetches and every `<img>`. Separately, `NUXT_PUBLIC_SITE_URL` is
   read by `i18n.baseUrl` during `nuxt build`, so it is compiled into the output
   — a build without it emits relative `hreflang` links and logs `I18n baseUrl
   is required to generate valid SEO tag links.` on every render. Compose passes
   it as a build argument *and* a runtime variable from the same `.env` entry,
   but changing it still needs a rebuild:

   ```bash
   docker compose up -d --build ui
   ```

   Staging and production have different origins, so they need different builds.
   That is the intended model — build once per environment, the way a CI
   environment supplies its own variables — not one image retargeted at
   start-up. Everything else (`NUXT_STRAPI_URL`, `NUXT_PUBLIC_STRAPI_URL`,
   `NUXT_SITE_ENV`, all the Strapi settings) is runtime-only and a restart is
   enough.

### Where uploads live

The `cms` service mounts the named volume `cms_uploads` at
`/app/cms/public/uploads`, because Strapi's default upload provider writes to
disk — without it, every image an editor uploads dies on the next `--build`.
Back it up alongside the database. The alternative is an S3-compatible upload
provider (R2, S3, Cloudinary) configured in `cms/config/plugins.ts`; media URLs
handle either, since absolute provider URLs pass through `mediaUrl()` untouched.

Strapi runs unprivileged in the container, as user `node`. Docker fixes a named
volume's ownership only when it first creates the volume, so a volume left over
from an older root-running image would be unwritable and every upload would fail
with `EACCES`. `cms/docker-entrypoint.sh` re-owns the mount at start-up and then
drops to `node`, so both a fresh volume and an upgraded one work with no manual
step.

### There is no containerised dev loop

Both images are production builds — prod-only dependencies, a compiled Nuxt
`.output`, `strapi start` rather than `strapi develop`. Bind-mounting source over
them changes nothing. Develop on the host, as in §4–§5: `docker compose up
postgres -d`, then `pnpm dev:cms` and `pnpm dev:ui`.

### Environment for production

| Variable | Where | Value |
| --- | --- | --- |
| `POSTGRES_*` | root `.env` | Your production database |
| `APP_KEYS`, `*_SALT`, `ADMIN_JWT_SECRET`, `ENCRYPTION_KEY` | root `.env` | **Fresh secrets.** Do not reuse the development set |
| `JWT_SECRET` | root `.env` | **Required.** It reads like an end-user-accounts feature, but `@strapi/plugin-users-permissions` is installed and its bootstrap aborts the whole boot with `Missing jwtSecret` when it is absent |
| `NUXT_STRAPI_URL` | root `.env` (optional) | The CMS as the **ui container** reaches it. Defaults to `http://cms:1337`; set it only to point at a CMS outside this compose project. Every server-rendered fetch uses this — see "blank on reload" in [§12](#12-troubleshooting) |
| `NUXT_PUBLIC_STRAPI_URL` | root `.env` | The CMS as a **visitor's browser** reaches it, e.g. `https://cms.xasa.example` — client-side fetches and every `<img>`. Never `http://cms:1337`: it exists only inside the compose network, and every image on the site would 404 |
| `NUXT_PUBLIC_SITE_URL` | root `.env` | Your public origin, e.g. `https://xasa.example` — canonical URLs, `hreflang` and the sitemap all read it. Compose passes it as a build argument as well, so changing it needs `--build` |
| `NUXT_SITE_ENV` | root `.env` | `production`. **Anything else serves `Disallow: /` and `noindex`** |

That last one is the point of the variable: set it to `staging` on your staging
instance, or search engines index the staging copy alongside the real site.

### First run on the server

Same order as locally. Bring up the database, start the CMS, visit `/admin` to
create the administrator, then run the seed once — remembering that the seed is
what grants the public API permissions, so a production instance that never
runs it serves an empty site.

### Backups

Two things to back up, and both matter:

```bash
docker compose exec postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup.sql
```

…and the uploads directory or bucket. A database backup without the media is
a site full of broken images.

---

## 12. Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| Site loads but every section is empty | The seed never ran, so the Public role has no permissions. Check with `curl http://localhost:1337/api/articles` — a 403 confirms it. Run `cd cms && pnpm seed:example`, or grant `find`/`findOne` by hand ([§6](#6-seed--do-not-skip-this)) |
| `403 Forbidden` from the API | Same cause |
| Content saved in the admin but not on the site | It is a draft. Article, Event, Announcement, Programme, Document and Page need an explicit **Publish** |
| CMS starts fine but the admin is empty and the seed did nothing visible | `DATABASE_CLIENT` is unset in `cms/.env`, so Strapi is using SQLite at `cms/.tmp/data.db` instead of your Postgres |
| Seed prints "already been imported" | It only runs once. `pnpm seed:reset` then `pnpm seed:example` |
| `slug must be a string type, but the final value was: null` | A translation in `data.json` is missing its `slug`. The slug is shared across languages but must still be present in each translation payload |
| `Document with id … locale "ar" not found` | A translation points at a related entry that has no version in that language. Translate the target first — people and categories before the articles that reference them |
| An Arabic page shows English text | No Arabic version exists for that entry. Falling back is deliberate, not a bug — translate the entry |
| Arabic article has no byline or category | Relations are per language. Set the author, category and branch again on the Arabic version |
| A new Page is nowhere in the menu | Tick `showInMenu` and give it a `menuOrder` |
| **Under Docker: blank on reload, but fine once you click around** | `NUXT_STRAPI_URL` is wrong or unset, so SSR is calling `http://localhost:1337` — which, inside the `ui` container, is the `ui` container. The browser then hydrates and refetches over the public URL, which is why navigating works. It should be `http://cms:1337`. Confirm with `docker compose logs cms \| grep "GET /api"` while reloading: no lines means SSR never reached the CMS |
| Under Docker: text renders but every image is broken | The reverse case — `NUXT_PUBLIC_STRAPI_URL` is set to `http://cms:1337`, which resolves only inside the compose network. It must be the CMS's public origin |
| Under Docker: uploading an image fails with `EACCES` | The `cms_uploads` volume predates the non-root image and is still root-owned. `cms/docker-entrypoint.sh` fixes this at start-up, so rebuild the `cms` image: `docker compose up -d --build cms` |
| The site does not appear in search results | `NUXT_SITE_ENV` is not exactly `production`, so every page is `noindex` |
| `EADDRINUSE` on 1337 or 3000 | Another copy is running. Stop it, or change `PORT` in `cms/.env` |
| Strapi restarts in a loop after a schema change | Stop it, delete `cms/dist` and `cms/.strapi`, start again |
| `pnpm install` fails on Node 25+ | Node must be `>=20 <=24` |

There is **no test or lint command** in this project — do not go looking for
`pnpm test` or `pnpm lint`. `pnpm format` runs Prettier over both packages.

---

## 13. Day to day

Once the site is up, the routine is short:

- **Editors** work entirely at `/admin`. Nothing they do requires a deployment
  — new articles, events, board changes and new pages all appear on the live
  site as soon as they are published.
- **Restarting** is needed only after a code or schema change, not after
  content changes.
- **Adding a menu destination** is a Page with `showInMenu` ticked.
- **Rebranding** is `tokens.css` plus `Card.takumi.vue`.
- **Adding or removing a language** is `ui/shared/utils/locales.ts` plus a
  message file plus a rebuild ([§8.4](#84-languages)) — the only common change
  that is not an admin setting.
- **Code changes are typechecked at commit.** `pnpm install` points
  `core.hooksPath` at `.githooks/`, and the pre-commit hook there runs
  `pnpm typecheck` — vue-tsc over the frontend, Vue templates included — on any
  commit touching `ui/**/*.{ts,vue,json}`. Anything else skips it. Run
  `pnpm format` alongside it; `git commit --no-verify` bypasses the hook.
- **Backups** should be scheduled, not remembered.

Improvements that would help every Xasa — a bug fix, a new block type, a
translation of the interface strings — are welcome as issues or pull requests
on the upstream template. Anything specific to your own association belongs in
your content and your two brand hues, not in the code.

---

**See also:** the root [`README.md`](../README.md) for the condensed version,
[`cms/README.md`](../cms/README.md) and [`ui/README.md`](../ui/README.md) for
package specifics, and [`CLAUDE.md`](../CLAUDE.md) if you are modifying the
template's code.

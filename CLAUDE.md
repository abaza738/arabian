# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Reusable, self-hosted website template for any **Xasa** (Adiga/Circassian community council). Used as a GitHub template — each org forks it and runs its own independent deployment (own DB, own CMS admin, no central server). The live copy in this repo is skinned for the Circassian Charity Association — Jordan.

## Monorepo layout

pnpm workspace (`pnpm-workspace.yaml`), two packages. **Use `pnpm`, not npm.** Node `>=20 <=24`.

- `cms/` — Strapi 5 headless CMS (TypeScript), port `1337`. Owns content + REST API.
- `ui/` — Nuxt 4 / Vue 3 frontend, port `3000`. Consumes the Strapi API.

Root scripts are workspace passthroughs (`pnpm --filter`):

```bash
pnpm dev:cms      # strapi develop (auto-reload); first run → create admin at /admin
pnpm dev:ui       # nuxt dev
pnpm build        # build cms then ui (order matters)
pnpm build:cms / build:ui / start:cms / start:ui
```

Local dev flow (see README): `docker compose up postgres -d` → `pnpm install` → `pnpm dev:cms` → `pnpm dev:ui` (separate terminal). Naming `postgres` is what keeps the other two down; deployment is `docker compose up -d --build`, which brings up all three (compose gates `ui` on the CMS's `/_health`). All three publish to `127.0.0.1` only — a published Docker port sits ahead of the host firewall, so loopback is what keeps a half-configured deployment off the internet. The public face is a fourth service, **`caddy`**, gated behind the `proxy` Compose profile (`COMPOSE_PROFILES=proxy` in `.env`) and configured by the root `Caddyfile`, which is two `reverse_proxy` lines and reads `SITE_DOMAIN`/`CMS_DOMAIN` from the environment rather than being edited per fork. Both hostnames are public because the browser talks to both: the site's every `<img>` resolves against `NUXT_PUBLIC_STRAPI_URL`. **Both images build from the repo root as context** (`context: .`, `dockerfile: cms/Dockerfile`) because the only pnpm lockfile is there — `docker build ./cms` fails on the missing lockfile. There is no containerised dev loop: the images are production builds (prod-only deps, compiled `.output`, `strapi start`), so bind-mounting source over them does nothing.

Package-local: `cd cms && pnpm seed:example` (idempotent, first-run only, loads `cms/data/data.json`), `pnpm upgrade` (Strapi codemod upgrade).

**Tooling is Prettier and a typecheck, both at the root: `pnpm format` (`.prettierrc` per package) and `pnpm typecheck` (`nuxt typecheck` → vue-tsc over `ui`, templates included; it must stay at zero).** No test or lint tooling is configured — don't invent a `pnpm test`/`pnpm lint`.

**`pnpm typecheck` takes ~40s, and `.githooks/pre-commit` already runs it on any commit touching `ui/**/*.{ts,vue,json}`** (`core.hooksPath` is pointed there by the root `prepare` script, so `pnpm install` wires it up). Don't run it after every edit — run it once when a change to `ui` is finished, or let the commit run it.

## Content model (Strapi → `cms/src/api/*`)

Each type is a standard Strapi api folder (`content-types/*/schema.json`, `controllers`, `routes`, `services`) — controllers/routes/services are the default factory generators, so the schema is where the real definition lives.

- **Single types:** `about` (story, `history`, blocks), `global` (site settings, hero, stats, CTA cards, social/footer links, contact, editorial picks).
- **Collection types:** `article`, `category` (`color` picks its pill hue), `event` (`startsAt`/`endsAt`, `location`, `eventStatus`, `featured`), `announcement` (`kind`, `expiresAt`, `pinned`), `programme` (`kind`, `schedule`, `lead`), `person`, `document` (`file`, `category`), `branch`, `page`.
- `article` → `person` (as `author`), `category`, `branch`; `programme` → `person` (as `lead`), `branch`; `announcement`/`person` → `branch`. `draftAndPublish` is **on** for `article`, `event`, `announcement`, `programme`, `document`, `page` and **off** for `person`, `branch`, `category`, `about`, `global`.
- **There is no `author` type.** It was merged into `person` — one directory for the board, past presidents, committee leads and article bylines. `person.termEnd === null` (with a `termStart`) means currently serving; that is the whole current-vs-past mechanism, and a person with no `termStart` is a contributor who appears in neither list.

**Localization rule.** Text is localized; identity, structure and photographs are shared (`i18n.localized: false`) — `slug`, `order`, dates, enums, booleans, emails, URLs, and covers. The exceptions are deliberate: `event.cover` and `document.file` stay localized because the artwork itself carries language (a poster, an Arabic PDF).

Two traps this creates, both handled in `cms/scripts/seed.js`:

- A **shared `uid` that is `required`** must be re-sent in every localization payload. A localization is created by *updating* into a new locale, and Strapi validates the payload it is handed — omit `slug` and it rejects the whole locale with "slug must be a `string` type, but the final value was: `null`".
- A **relation is held per locale** and is *not* copied from the default locale. Every localization must restate its relations, or that locale renders with no byline, no category and no branch. The target must already exist in that locale, or it is a hard `ValidationError`.

**Dynamic zones + shared components are the core content mechanism.** `article.blocks`, `event.blocks`, `programme.blocks`, `page.blocks` and `about.blocks` are `dynamiczone`s built from `shared.*` components in `cms/src/components/shared/` (`media`, `quote`, `rich-text`, `slider`; plus `shared.seo`, `hero`, `stat`, `cta-card`, `link`, `social-link`, `location`, `milestone`). Adding a new content block = **two coordinated edits**: (1) a `shared.<name>.json` component + add it to the dynamiczone's `components` array, (2) a matching `ui/app/components/Block/Block<Name>.vue` + a new branch in the block dispatcher (below).

## UI ↔ Strapi data flow (`ui/`)

- **Every read goes through `useCms()` (`ui/app/composables/useCms.ts`), never `useStrapi()` directly** — `find` / `findOne` / `findSingle` (the last for the two single types, which answer with one entry rather than a list). Collections are addressed by capitalized plural, e.g. `find("Articles", { populate: ["cover"] })`, and **the endpoint name alone types the result**: `CmsCollectionMap` in `ui/shared/types/query.ts` maps each one to its entry, so `find`, `useStrapiList()` and `AppEntryFeed` all infer it and no call site passes a type argument. **Relations/media aren't returned unless you `populate`** them.
- **The content model is `ui/shared/types/content.ts`, mirroring `cms/src/api/*` by hand** (auto-imported into the app *and* Nitro). Add a field to a schema → add it there. Two rules hold throughout: a relation or media field is optional because it is absent unless populated, and an empty field comes back `null`, not missing. `CmsBlock` is a union discriminated on `__component`, which is what makes `BlockZone`'s dispatch checkable.
- **`useCms()` holds the one cast in the data layer, and `useAppLocale()` the other.** `@nuxtjs/strapi`'s own `Strapi5RequestParams` cannot describe this site — its `locale` is a closed CLDR list with no `ady`/`kbd`, its `pagination` demands `start` beside `limit`, and its `filters` resolve to `never` for any nullable field and reject a top-level `$or`. `ui/shared/types/query.ts` declares the parameters instead. Don't add an `as` at a call site; fix the type.
- **`ui/shared/utils/locales.ts` is the one place a fork changes the language list.** `LOCALES` is spread into `nuxt.config`'s `i18n.locales` and `AppLocale` — what every query's `locale` is checked against — is *derived* from it (`(typeof LOCALES)[number]['code']`). Adding a language is one entry plus its `i18n/*.json`; never write a locale code into a type by hand.
- **Block rendering** lives in `ui/app/components/Block/BlockZone.vue`: it `v-for`s a `blocks` array and dispatches on `block.__component` (`shared.rich-text` → `BlockRichText`, etc.). Rich text is Markdown rendered through `@comark/nuxt`'s `<Markdown>`. This dispatcher is the thing to extend when a new dynamiczone component is added; the article and event pages both just render `<BlockZone :blocks="…" />`.
- **Locale fallback:** every Strapi read goes through `withLocaleFallback()` (`ui/app/utils/localeFallback.ts`), which retries against `en` when a locale has no translation. It absorbs both shapes of "missing": an empty list from `find`, and a **thrown 404** from `findOne`. Detail pages for untranslated locales depend on the second case.
- **Paginated lists:** `useStrapiList()` (`ui/app/composables/useStrapiList.ts`) SSRs page 1 and appends later pages via `loadMore()`. It pins the locale that actually answered page 1 (read off the payload, since `withLocaleFallback` may have silently switched to `en`) — asking for page 2 in the requested locale would come back empty.
- **Every list route is `AppEntryFeed` plus a query** — `news`, `events`, `announcements`, `programmes`, `documents` and the branch-scoped twins. It owns the fetch, the three states, Load more and the month headings; the page supplies only the query and an `#item` slot. Pass `date-field` for a chronological feed (it drives `startsMonth()` from `ui/app/utils/monthHeadings.ts`) and **omit it** for one ordered by hand. Do not write a new list page from scratch.
- **A filter is a URL query parameter, and it must be folded into `cache-key`.** `AppFilterBar` renders the options as links (`?category=`, `?when=past`) and holds no state; `useCategoryFilter()` and `useEventWhen()` read the parameter for the site-wide feed and its branch twin alike. Changing a query parameter re-runs neither the page's setup nor `useStrapiList()` — the cache key is the only thing that tells `useAsyncData` to refetch, so a feed that leaves the filter out of it silently keeps the previous filter's rows. The `#filters` slot renders above all three states, so an empty result still shows the control that produced it.
- **Media URLs:** always build them with `mediaUrl()` (`ui/app/utils/mediaUrl.ts`) — Strapi returns root-relative paths and this prepends the host, read at runtime, which matters for a prebuilt image. Absolute URLs (S3/Cloudinary providers) pass through untouched.
- **`@nuxtjs/strapi` stores its config in `runtimeConfig` twice, and two different env vars set the two copies.** The private `strapi.url` (**`NUXT_STRAPI_URL`**) drives the server-side client, so it is what every SSR fetch uses. The public `public.strapi.url` (**`NUXT_PUBLIC_STRAPI_URL`**) drives client-side fetches and `mediaUrl()`. They are the same value everywhere except Docker, where the server reaches the CMS at `http://cms:1337` over the compose network and a browser cannot. Setting only the public one is the trap: SSR falls back to the *build-time* default `http://localhost:1337`, which inside the ui container is the ui container, so every server fetch fails and the page renders blank until the browser hydrates and refetches — it looks fine while clicking around and blank on reload. Nitro code calling Strapi directly (`ui/server/api/__sitemap__/urls.ts`) must read the **private** one; `mediaUrl()` must read the **public** one, because its output is an `<img src>` a browser resolves.

## Navigation (important)

`SiteNav.vue` is the chrome: the logo, three shortcut links (News / Events / About), the "More" trigger, the locale switcher, the Join CTA, and — for an org with two or more branches — the branch row under them. The switcher is a **segmented control**, every offered locale on screen at once (`localeShort()` reads the `short` label each locale carries in `nuxt.config`); it and the CTA are the only two controls that exist nowhere else, so they are the ones the bar keeps on a phone while the three shortcuts and the written wordmark drop.

**Every destination other than those three lives in `MegaMenu.vue`**, one panel used at all widths — the same markup, only the column layout changes, and it is a `role="dialog"` *only* at the width where it covers the viewport (`matchMedia`, kept in step with the stylesheet's own breakpoint). The panel carries columns of links and nothing else; it holds no locale switcher, CTA or contact strip, because the bar above it is still on screen.

Three heights are load-bearing and interlock. The panel is a **normal flow child** of the nav between the two rows, so opening it pushes the branch row down the page rather than covering it — and `.site-nav` pins `height: var(--nav-stack-height)` so that growth overflows the sticky box instead of reaching the document and shifting the page. Row separators are `inset` box-shadows, never borders, for the same reason: a real border would add a pixel `--nav-stack-height` does not account for, and every sticky element on the site offsets against that token.

The panel's last column is the `page` collection filtered on `showInMenu`, ordered by `menuOrder` (`useMenuPages()`). **That is the only way a `page` is reachable** — before it existed, a page an editor created could be found only by typing its URL. Adding a destination is a CMS action, not a code change.

## Hero scene (`AppHeroScene.vue`)

The hero's animated artwork — layered images that idly float and shift with the pointer. It is the one place the site uses `@vueuse/nuxt` and `motion-v/nuxt`; both modules auto-import, so VueUse composables and `<Motion>` are used without an import line.

- **The art is repo-static, not CMS media.** A `LAYERS` const inside the component names files under `ui/public/hero/`, back to front, each with its `depth` (pointer travel multiplier), float amplitude and period. Adding or reordering a layer is one entry. A file that 404s hides its own layer through the `<img>` `@error` handler, the same way a seed photograph with no file behind it is skipped — so the scene degrades instead of breaking, and a fork that ships no art simply has no scene.
- **The parallax and the float cannot share an element.** motion-v writes `transform` inline on the node it renders; a CSS keyframe animating `transform` on that same node silently loses. The outer `<Motion>` owns the pointer parallax (spring, so the stack eases to rest rather than snapping) and the inner `<img>` owns the `scene-float` keyframe. Per-layer float values reach the keyframe as inline custom properties (`--drift-y`, `--tilt`), which is what keeps one keyframe serving every layer.
- **Parallax is gated on `sourceType === 'mouse'`.** `useMouse` starts at `0,0`, which normalises to the top-left corner — without the gate every layer would slam to one side before the pointer ever moves, and stay there on a touch device. `usePreferredReducedMotion()` pins the same offsets to zero, and a `prefers-reduced-motion` block stops the float; the layers still render.
- **`sections.hero.showScene` turns it on per hero block**, default off. `BlockZone` renders `sections.hero` on seven routes, so an unconditional scene would put an aircraft on every page's hero. The seed sets it on the home hero only.

## Seed (`cms/data/`)

Tracked in git on purpose (`cms/.gitignore` un-ignores `data/data.json` and `data/uploads/` narrowly), so a fork's first `pnpm seed:example` produces a working site rather than an empty one.

**Seed media is optional.** `data.json` names photographs a fork is expected to drop into `cms/data/uploads/`; a name with no file behind it is skipped, not an error, because every image slot in the UI has a designed placeholder. Only `logo.svg`, `favicon.svg` and three placeholder PDFs actually ship. Do not "fix" a missing-photograph reference by deleting the name.

`data.json` points at relations **by slug**, never by position or database id, and `seed.js`'s `importCollection()` is the one place the create-then-translate loop lives. `reset-seed.js` must learn every new collection, relation-holders first, or a reset orphans it and the next seed duplicates it.

## URL convention

Time-stamped content is addressed by `documentId` (`/article/[id]`, `/event/[id]`, `/announcement/[id]`); evergreen content is addressed by slug (`/[slug]`, `/branch/[slug]`, `/programme/[slug]`). New routes also need a line in `ui/server/api/__sitemap__/urls.ts` — `person` and `document` are absent there on purpose, since neither has a route.

## Config notes

- `cms/config/database.ts` supports `sqlite` (default when `DATABASE_CLIENT` unset → `.tmp/data.db`), `postgres`, `mysql`. Docker/prod use postgres 17; a fresh `pnpm dev:cms` with no `cms/.env` DB vars silently falls back to sqlite.
- Strapi secrets (`APP_KEYS`, `*_SALT`, `ADMIN_JWT_SECRET`, `ENCRYPTION_KEY`) come from env; generate with `node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"`. Env var tables are in the root `README.md`.
- **`NUXT_PUBLIC_SITE_URL` is the one variable read at build time as well as at runtime.** `i18n.baseUrl` reads it in `nuxt.config.ts`, which `nuxt build` evaluates, so that half is compiled in — deliberately: each environment gets its own build (`ui/Dockerfile` takes it as an `ARG`). A build without it emits relative `hreflang` links and warns on every render, and setting it at runtime alone will not correct a build that had a different value. Everything else the app needs — `NUXT_STRAPI_URL`, `NUXT_PUBLIC_STRAPI_URL`, `NUXT_SITE_ENV` — is runtime-only and must stay out of `nuxt.config.ts`. Never declare `runtimeConfig.public.i18n.baseUrl`: i18n `defu`-merges its own value and an empty string there wins, silently discarding the configured one.
- Styling: plain CSS, no Tailwind/UI framework — the `flex`/`gap-lg`/`grid-2` classes are project utilities in `ui/app/assets/styles/utils.css`.
- **Every design token lives in `ui/app/assets/styles/tokens.css`, and components hold no literals.** No hex, no `font-size: 13px`, no `line-height: 1.55` — a value that is not in the scale is wrong, not the scale. Need something new? Name it in `tokens.css` first. The scales are `--color-*`, `--text-*` (plus fluid `--text-display-*`), `--weight-*`, `--leading-*`, `--tracking-*`, `--space-*`, `--radius-*`, `--shadow-*`, `--z-*`, `--transition`, `--duration-float`, `--layout-*` and the `--nav-*` metrics.
  - The accent and gold families are derived from `--hue-accent` / `--hue-support`, so a fork rebrands by editing two numbers. Category pill hues and notice hues are literal on purpose — do not "fix" them into the accent. Which hue a category wears is the editor's `category.color`, never its slug: a slug is an address, and a category an admin invents has one `AppPill` has never heard of.
  - **Breakpoints are literal by necessity** (`@media` cannot read a custom property). Exactly three exist — `560px`, `720px`, `900px`, documented in `tokens.css`. Snap to the nearest rather than inventing a fourth.
  - `ui/app/components/OgImage/Card.takumi.vue` is the one exemption: it renders outside a browser where custom properties do not resolve, so its colours are hand-mirrored from the tokens.

## Agent Instructions

All instructions are in `./AGENTS.md`.

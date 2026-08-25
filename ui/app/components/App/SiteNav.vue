<script setup lang="ts">
const {
  global,
  hubs = [],
  pages = [],
  activeHub,
} = defineProps<{
  global?: CmsGlobal | null
  hubs?: CmsHub[]
  pages?: CmsPage[]
  activeHub?: CmsHub | null
}>()

const { t } = useI18n()
const localePath = useLocalePath()

const scrolled = ref(false)
const onScroll = () => {
  scrolled.value = window.scrollY > 10
}

const showHubBar = computed(() => hubs.length >= 2)

const SCOPED: Record<string, string> = {
  index: 'hub',
  news: 'hub-news',
  events: 'hub-events',
}
const UNSCOPED: Record<string, string> = Object.fromEntries(
  Object.entries(SCOPED).map(([wide, scoped]) => [scoped, wide]),
)

// i18n appends `___en` / `___ar` to every route name.
const route = useRoute()
const routeName = computed(() => String(route.name ?? '').split('___')[0] ?? '')

// Clicking a hub keeps the current sub-page: from /hub/amman/news,
// "Zarqa" lands on /hub/zarqa/news, not on Zarqa's front page. Anything with
// no hub twin — About, an article, a one-off page — falls to the hub home.
const hubTo = (slug: string) => {
  const name = routeName.value.startsWith('hub')
    ? routeName.value
    : (SCOPED[routeName.value] ?? 'hub')
  return localePath({ name, params: { slug } })
}

// The inverse, and a no-op link when you are already site-wide: the tab is
// marked current there, so it is a label more than a destination.
const allHubsTo = computed(() => {
  const wide = UNSCOPED[routeName.value]
  return wide ? localePath({ name: wide }) : route.fullPath
})

// The bar's shortcuts, not the site's map — that is the mega menu's job. These
// three are the highest-traffic destinations and stay one click away on a
// screen wide enough to hold them.
//
// In a hub, News and Events mean *this hub's* news and events. About does
// not — there is one About.
const links = computed(() => {
  const slug = activeHub?.slug
  return [
    {
      key: 'news',
      to: slug ? { name: 'hub-news', params: { slug } } : { name: 'news' },
    },
    {
      key: 'events',
      to: slug ? { name: 'hub-events', params: { slug } } : { name: 'events' },
    },
    { key: 'about', to: { name: 'about' } },
  ]
})

// The crew portal lives on whatever system actually tracks hours and flights,
// so this is a plain outbound link the CMS owns rather than a route. Through
// `externalUrl` because the URL is typed in the Strapi admin: an unrecognised
// scheme yields '' and the button does not render, instead of becoming a live
// `javascript:` handler. An org with no portal yet simply leaves the field
// empty and never sees the button.
const pilotPortal = computed(() => {
  const href = externalUrl(global?.pilotPortalUrl)
  return href
    ? { href, label: global?.pilotPortalLabel || t('nav.pilotLogin') }
    : null
})

const joinCard = computed(() => global?.ctaCards?.[0])

// The mega menu's open state. It lives here rather than in the panel because
// the trigger, the outside-click and the route watcher all sit in this file.
const menuOpen = ref(false)
// One ref for the whole nav — bar, panel and hub bar are all inside it, so
// "did the click land outside the navigation" is a single `contains` test. The
// panel goes `position: fixed` on a phone but stays a DOM descendant, which is
// what `contains` actually asks about.
const navRoot = ref<HTMLElement | null>(null)
// Kept only so Escape can hand focus back to what opened the panel.
const navToggle = ref<HTMLElement | null>(null)

// A panel that only closes by re-clicking its own trigger is a trap: click
// anywhere else, or press Escape, and it should go away.
const onPointerDown = (e: Event) => {
  // The trigger is inside the nav too, so this never fires on the click that
  // is about to toggle the panel shut — no reopen race to guard against.
  if (menuOpen.value && !navRoot.value?.contains(e.target as Node)) {
    menuOpen.value = false
  }
}
const onKeydown = (e: KeyboardEvent) => {
  if (e.key !== 'Escape' || !menuOpen.value) return

  menuOpen.value = false
  // Focus is inside the panel that just closed, so without this a keyboard
  // reader is dropped at the top of the document.
  navToggle.value?.focus()
}

// One rule instead of a handler on every link and the CTA: navigating anywhere
// closes the panel.
watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  document.removeEventListener('pointerdown', onPointerDown)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <nav ref="navRoot" :class="['site-nav', { scrolled }]">
    <div class="inner-wide nav-inner">
      <NuxtLink :to="localePath({ name: 'index' })" class="nav-logo">
        <div class="nav-logo-circle">
          <img
            v-if="global?.logo"
            :src="mediaUrl(global.logo.url)"
            class="nav-logo-img"
            :alt="global?.siteName"
          />
          <div v-else class="nav-logo-inner" />
        </div>
        <div class="nav-wordmark">
          <span class="nav-wordmark-primary">{{ global?.siteName }}</span>
          <span v-if="global?.wordmarkSub" class="nav-wordmark-sub">
            {{ global.wordmarkSub }}
          </span>
        </div>
      </NuxtLink>

      <div class="nav-links">
        <NuxtLink
          v-for="link in links"
          :key="link.key"
          :to="localePath(link.to)"
          class="nav-link nav-shortcut"
        >
          {{ t(`nav.${link.key}`) }}
        </NuxtLink>

        <!-- The one control present at every width: beside the three shortcuts
             on a wide screen, and on a phone the whole navigation. It reads as
             a fourth nav item rather than a hamburger, because that is what it
             is — the rest of the same list. -->
        <!-- No `aria-label`: it would override the visible word and leave the
             button answering to a name nobody can see, which is the one thing
             voice control cannot work around. -->
        <button
          ref="navToggle"
          class="nav-link nav-more"
          type="button"
          aria-controls="site-nav-menu"
          :aria-expanded="menuOpen"
          @click="menuOpen = !menuOpen"
        >
          <span>{{ t('menu.more') }}</span>
          <svg
            class="nav-more-caret"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      <!-- Absent rather than empty when a site has neither a crew portal nor a
           join card: an empty flex child still spends the row's gap. -->
      <div v-if="pilotPortal || joinCard" class="nav-end">
        <!-- Outline against the join card's fill: the two sit side by side and
             one of them has to be the quieter of the pair. Returning crew know
             where this is; the join card is doing the persuading. -->
        <AppButton
          v-if="pilotPortal"
          class="nav-portal"
          variant="outline"
          :href="pilotPortal.href"
        >
          {{ pilotPortal.label }}
        </AppButton>

        <AppButton
          v-if="joinCard"
          class="nav-join"
          variant="accent"
          :to="localeUrl(joinCard.buttonUrl)"
        >
          {{ t('nav.join') }}
        </AppButton>
      </div>
    </div>

    <AppMegaMenu :open="menuOpen" :hubs="hubs" :pages="pages" />

    <!-- The wrapper is full-bleed so the rule between the two rows reaches the
         viewport's edges; the bar inside it lines up with the one above. -->
    <div v-if="showHubBar" class="hub-row">
      <nav class="inner-wide hub-bar" :aria-label="t('sections.hubs')">
        <span class="hub-bar-label">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {{ t('sections.hubs') }}
        </span>

        <NuxtLink
          :to="allHubsTo"
          class="hub-tab"
          :aria-current="activeHub ? undefined : 'page'"
        >
          {{ t('hub.allHubs') }}
        </NuxtLink>

        <NuxtLink
          v-for="b in hubs"
          :key="b.documentId"
          :to="hubTo(b.slug)"
          class="hub-tab"
          :aria-current="b.slug === activeHub?.slug ? 'page' : undefined"
        >
          {{ b.name }}
        </NuxtLink>
      </nav>
    </div>
  </nav>
</template>

<style scoped>
.site-nav {
  position: sticky;
  top: 0;
  z-index: var(--z-nav);
  background: var(--color-surface);
  /* Pinned to exactly the chrome's resting height — the same figure every
     other sticky element already offsets against. The mega panel is a normal
     flow child, so opening it pushes the hub bar down the page instead of
     covering it, and the fixed height keeps that growth from reaching the
     document: the panel and the displaced hub bar overflow this box and
     paint over the page, and nothing below the nav moves. */
  height: var(--nav-stack-height);
  transition: box-shadow var(--transition);
}
.site-nav.scrolled {
  box-shadow: var(--shadow-nav);
}

.nav-inner {
  display: flex;
  align-items: center;
  /* The floor under `.nav-links`' auto margins: once the bar is tight enough
     that they collapse, this is what keeps the truncated wordmark off the
     first link. */
  gap: var(--space-6);
  min-height: var(--nav-height);
  padding-block: var(--space-2-5);
  /* The rule under the first row, drawn here rather than on `.site-nav` so it
     stays put when the panel opens between the two rows. An inset shadow, not
     a border: a real one would add a pixel `--nav-stack-height` does not know
     about. */
  box-shadow: inset 0 -1px 0 var(--color-border);
}

/* `--nav-height` drops when a hub bar exists, but a min-height alone cannot
   shrink a row its padding already fills — the block padding has to come down
   with it or the two rows stack taller than the pair is meant to be. */
.site-nav:has(.hub-bar) .nav-inner {
  padding-block: var(--space-1-5);
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-decoration: none;
  /* The bar's only elastic part. Under compression the name gives way before
     the links and the CTA do — those are destinations, this is a label the
     reader is already looking at. */
  min-width: 0;

  .nav-logo-circle {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;

    .nav-logo-inner {
      width: 16px;
      height: 16px;
    }

    .nav-logo-img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
  }
}

.nav-wordmark {
  display: flex;
  flex-direction: column;
  gap: var(--space-px);
  min-width: 0;
}
.nav-wordmark-primary,
.nav-wordmark-sub {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.nav-wordmark-primary {
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  color: var(--color-text);
  line-height: var(--leading-snug);
}
.nav-wordmark-sub {
  font-size: var(--text-2xs);
  font-weight: var(--weight-light);
  color: var(--color-text-tertiary);
  letter-spacing: var(--tracking-xs);
  line-height: var(--leading-snug);
}

/* Centred between the wordmark and the end group rather than pushed against
   either, which is what makes the bar read as three parts instead of a logo
   and a pile of controls. */
.nav-links {
  display: flex;
  align-items: center;
  gap: var(--space-7);
  margin-inline: auto;
}
.nav-link {
  font-family: var(--font-sans);
  font-size: var(--text-md);
  font-weight: var(--weight-normal);
  color: var(--color-text-secondary);
  text-decoration: none;
  position: relative;
  padding-bottom: var(--space-1);
  white-space: nowrap;
  transition: color var(--transition);
}
.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  inset-inline-start: 0;
  width: 0;
  height: 1.5px;
  background: var(--color-accent);
  transition: width var(--transition);
}
.nav-link:hover {
  color: var(--color-text);
}
.nav-link:hover::after {
  width: 100%;
}

/* Where you are, marked the same way hover previews it. `router-link-active`
   rather than the exact variant: a hub's News link should stay lit on
   /hub/amman/news as well as on its own URL. */
.nav-shortcut.router-link-active {
  color: var(--color-text);
}
.nav-shortcut.router-link-active::after {
  width: 100%;
}

.nav-more {
  display: flex;
  align-items: center;
  gap: var(--space-1-5);
  /* A button, so the UA's own padding has to be cleared before `.nav-link`'s
     single padding-bottom puts the underline where the links have it. */
  padding: 0 0 var(--space-1);
  border: none;
  background: transparent;
  cursor: pointer;
}
.nav-more[aria-expanded='true'] {
  color: var(--color-text);
}
.nav-more[aria-expanded='true']::after {
  width: 100%;
}
.nav-more-caret {
  transition: transform var(--transition);
}
.nav-more[aria-expanded='true'] .nav-more-caret {
  transform: rotate(180deg);
}

.nav-end {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-shrink: 0;
}

/* The second row. `--hub-bar-height` is fixed rather than intrinsic because
   the sticky month headings offset against it — a bar that grew with its
   content would leave them parked behind it. The rule above it is an inset
   shadow for the same reason the bar's own is: no pixel of layout. */
.hub-row {
  /* Opaque in its own right: with the panel open this row is pushed clear of
     the nav's own box and paints over the page behind it. */
  background: var(--color-surface);
  box-shadow: inset 0 -1px 0 var(--color-border);
}
.hub-bar {
  display: flex;
  /* Stretch, not centre: each tab is the bar's full height so the active one's
     underline lands on the bar's bottom edge instead of floating mid-row. */
  align-items: stretch;
  gap: var(--space-5);
  height: var(--hub-bar-height);
  /* One line, never two: on a narrow screen the strip scrolls sideways instead
     of wrapping into a second row that would break the height above. */
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
}
.hub-bar::-webkit-scrollbar {
  display: none;
}

.hub-bar-label {
  display: flex;
  align-items: center;
  gap: var(--space-1-5);
  flex-shrink: 0;
  font-size: var(--text-xs);
  font-weight: var(--weight-light);
  color: var(--color-text-tertiary);
  white-space: nowrap;
}

.hub-tab {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  font-size: var(--text-sm);
  font-weight: var(--weight-normal);
  color: var(--color-text-tertiary);
  text-decoration: none;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
  transition:
    color var(--transition),
    border-color var(--transition);
}
.hub-tab:hover {
  color: var(--color-text);
}
.hub-tab[aria-current='page'] {
  color: var(--color-text);
  font-weight: var(--weight-medium);
  border-bottom-color: var(--color-accent);
}

/* Below this the row cannot hold the wordmark, three links and both buttons at
   once. The three shortcuts and the written name are what go: the mega menu
   already carries every destination, whereas the crew portal and the join CTA
   exist nowhere else in the chrome. The mark alone still says whose site this
   is and still goes home. */
@media (max-width: 720px) {
  .nav-shortcut,
  .nav-wordmark {
    display: none;
  }

  .nav-links {
    margin-inline-start: auto;
    margin-inline-end: 0;
  }

  /* Now the only control in the bar, so it earns a real touch target. The
     underline goes with it — at this width there is nothing beside it for the
     mark to distinguish, and the caret already says open. */
  .nav-more {
    min-height: 44px;
    padding-inline: var(--space-2);
    margin-inline-end: calc(-1 * var(--space-2));
  }
  .nav-more::after {
    display: none;
  }

  .nav-links {
    gap: var(--space-4);
  }
  .nav-end {
    gap: var(--space-2-5);
  }
}

/* On a phone the two buttons give up their generous side padding rather than
   the row giving up a button. Scoped styles reach a child component's root
   node, so this lands on the buttons themselves without `:deep` into their
   internals. */
@media (max-width: 560px) {
  .nav-portal,
  .nav-join {
    padding-inline: var(--space-3);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nav-more-caret {
    transition: none;
  }
}
</style>

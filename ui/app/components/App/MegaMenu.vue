<script setup lang="ts">
/**
 * The site's one navigation panel: columns of destinations, and nothing else.
 * The locale switcher and the join CTA are the bar's job at every width — a
 * panel that repeated them was carrying a second copy of two controls that are
 * already on screen when it opens.
 *
 * One panel at every width rather than a desktop mega menu and a separate
 * mobile drawer — the markup is identical and only the column layout changes,
 * so there is one set of links to keep correct instead of two. It *is* a modal
 * at the width where it covers the viewport, and only there: a dropdown panel
 * on a desktop bar that trapped focus would be a bug, not an affordance.
 *
 * Presentation only. `open` is owned by SiteNav, which also owns the trigger,
 * the outside-click and the Escape key.
 */
const {
  hubs = [],
  pages = [],
  open,
} = defineProps<{
  hubs?: CmsHub[]
  pages?: CmsPage[]
  open: boolean
}>()

const { t } = useI18n()
const localePath = useLocalePath()

const panel = ref<HTMLElement | null>(null)

/**
 * Whether the panel currently covers the viewport. Read from the same
 * breakpoint the stylesheet below uses; a11y semantics have to agree with what
 * the reader can actually see, and CSS cannot tell the template.
 */
const isModal = ref(false)
let query: MediaQueryList | null = null

/**
 * The scroll lock belongs to "modal *and* open", so it has to be re-evaluated
 * whenever either half changes. Widening the window with the panel open would
 * otherwise leave `overflow: hidden` on the body and the page unscrollable.
 */
const lockScroll = (locked: boolean) => {
  if (import.meta.server) return
  document.body.classList.toggle('nav-panel-open', locked)
}

const syncModal = (e: MediaQueryListEvent | MediaQueryList) => {
  isModal.value = e.matches
  lockScroll(open && isModal.value)
}

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
const focusables = () =>
  Array.from(panel.value?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])

// Focus enters the panel on open and Tab cycles inside it — but only while it
// is modal. At desktop width the bar behind stays reachable on purpose.
watch(
  () => open,
  async (isOpen) => {
    if (import.meta.server) return
    lockScroll(isOpen && isModal.value)
    if (!isOpen || !isModal.value) return
    await nextTick()
    focusables()[0]?.focus()
  },
)

const onKeydown = (e: KeyboardEvent) => {
  if (!open || !isModal.value || e.key !== 'Tab') return

  const items = focusables()
  const first = items[0]
  const last = items[items.length - 1]
  if (!first || !last) return

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

onMounted(() => {
  query = window.matchMedia('(max-width: 720px)')
  syncModal(query)
  query.addEventListener('change', syncModal)
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  query?.removeEventListener('change', syncModal)
  document.removeEventListener('keydown', onKeydown)
  // A panel unmounted while open would otherwise leave the page unscrollable.
  lockScroll(false)
})
</script>

<template>
  <!-- v-show, not v-if: the destinations stay in the document for a crawler
       and for the focus handling above, which would otherwise race the mount. -->
  <div
    v-show="open"
    id="site-nav-menu"
    ref="panel"
    class="mega"
    :role="isModal ? 'dialog' : undefined"
    :aria-modal="isModal ? 'true' : undefined"
    :aria-label="t('nav.menu')"
  >
    <div class="inner-wide mega-inner">
      <nav class="mega-col" :aria-labelledby="'mega-read'">
        <h2 id="mega-read" class="mega-heading">{{ t('menu.read') }}</h2>
        <NuxtLink :to="localePath({ name: 'news' })" class="mega-link">
          {{ t('nav.news') }}
        </NuxtLink>
        <NuxtLink :to="localePath({ name: 'announcements' })" class="mega-link">
          {{ t('nav.announcements') }}
        </NuxtLink>
        <NuxtLink :to="localePath({ name: 'events' })" class="mega-link">
          {{ t('nav.events') }}
        </NuxtLink>
      </nav>

      <nav class="mega-col" :aria-labelledby="'mega-airline'">
        <h2 id="mega-airline" class="mega-heading">
          {{ t('menu.airline') }}
        </h2>
        <NuxtLink :to="localePath({ name: 'about' })" class="mega-link">
          {{ t('nav.about') }}
        </NuxtLink>
        <NuxtLink :to="localePath({ name: 'fleet' })" class="mega-link">
          {{ t('nav.fleet') }}
        </NuxtLink>
        <NuxtLink :to="localePath({ name: 'network' })" class="mega-link">
          {{ t('nav.network') }}
        </NuxtLink>
        <NuxtLink :to="localePath({ name: 'flights' })" class="mega-link">
          {{ t('nav.flights') }}
        </NuxtLink>
        <NuxtLink :to="localePath({ name: 'roster' })" class="mega-link">
          {{ t('nav.roster') }}
        </NuxtLink>
        <NuxtLink :to="localePath({ name: 'documents' })" class="mega-link">
          {{ t('nav.documents') }}
        </NuxtLink>
      </nav>

      <nav v-if="hubs.length" class="mega-col" aria-labelledby="mega-hubs">
        <h2 id="mega-hubs" class="mega-heading">
          {{ t('menu.hubs') }}
        </h2>
        <NuxtLink
          v-for="b in hubs"
          :key="b.documentId"
          :to="localePath({ name: 'hub', params: { slug: b.slug } })"
          class="mega-link"
        >
          {{ b.name }}
        </NuxtLink>
      </nav>

      <nav v-if="pages.length" class="mega-col" aria-labelledby="mega-pages">
        <h2 id="mega-pages" class="mega-heading">{{ t('menu.pages') }}</h2>
        <NuxtLink
          v-for="p in pages"
          :key="p.documentId"
          :to="localePath({ name: 'page', params: { slug: p.slug } })"
          class="mega-link"
        >
          {{ p.title }}
        </NuxtLink>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.mega {
  background: var(--color-surface-subtle);
  box-shadow: var(--shadow-nav);
  max-height: calc(100dvh - var(--nav-stack-height));
  overflow-y: auto;
  animation: megaIn var(--transition);
}

.mega-inner {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-8);
  padding-block: var(--space-10);
}

.mega-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.mega-heading {
  font-size: var(--text-3xs);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-lg);
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-1);
}

.mega-link {
  font-family: var(--font-serif);
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color var(--transition);
}
.mega-link:hover {
  color: var(--color-accent);
}

@keyframes megaIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (max-width: 720px) {
  .mega {
    position: fixed;
    inset-inline: 0;
    top: var(--nav-stack-height);
    bottom: 0;
    overflow-y: auto;
    box-shadow: none;
  }

  .mega-inner {
    grid-template-columns: 1fr;
    gap: var(--space-6);
    padding-block: var(--space-6);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mega {
    animation: none;
  }
}
</style>

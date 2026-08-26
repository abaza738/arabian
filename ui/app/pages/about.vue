<script setup lang="ts">
definePageMeta({
  name: 'about',
})

const { findSingle } = useCms()
const { t } = useI18n()
const locale = useAppLocale()

const { data: global } = await useGlobal()

// Deduped with the layout's call, which already needs the same list for the
// nav bar — and it is where the soft-fail on a missing read permission lives,
// so a fork that has not granted it still gets an About page.
const { data: hubs } = await useHubs()

// The roster is its own collection now, not a component on `about` — see
// `usePilots()` for why.
const { data: pilots } = await usePilots()
const roster = computed(() => splitRoster(pilots.value))

const { data, error } = await useAsyncData(
  () => `about-${locale.value}`,
  () =>
    withLocaleFallback(locale.value, (l) =>
      findSingle('about', {
        locale: l,
        populate: {
          seo: SEO_POPULATE,
          history: true,
          blocks: { populate: '*' },
        },
      }),
    ),
  { watch: [locale] },
)

const about = computed(() => data.value?.data ?? null)

// The About page is one of the three nav links, so it must not 404 on a fresh
// fork that has not filled the single type in yet — it renders an empty state.
const hasContent = computed(
  () =>
    pilots.value.length > 0 ||
    (!!about.value &&
      (about.value.blocks?.length || about.value.history?.length)),
)

const contact = computed(() => ({
  email: global.value?.contactEmail,
  phone: global.value?.contactPhone,
  address: global.value?.contactAddress,
}))
const hasContact = computed(
  () =>
    !!(contact.value.email || contact.value.phone || contact.value.address) ||
    hubs.value.length > 0,
)

useEntrySeo(() => ({
  ...about.value,
  title: about.value?.title || t('nav.about'),
}))
</script>

<template>
  <div class="inner flex-1 flex flex-col about-page">
    <h1 class="about-title">{{ about?.title || t('nav.about') }}</h1>

    <p v-if="error" class="state-message">{{ t('error.body') }}</p>
    <p v-else-if="!hasContent && !hasContact" class="state-message">
      {{ t('about.empty') }}
    </p>

    <BlockZone v-if="about?.blocks?.length" :blocks="about.blocks" />

    <!-- ── Crew ── -->
    <section v-if="roster.crew.length" class="about-section">
      <AppSectionHeading
        :eyebrow="t('about.crewEyebrow')"
        :title="t('about.crew')"
        class="mb-lg"
      />

      <ul class="grid grid-3 gap-md pilots">
        <AppPilotCard
          v-for="pilot in roster.crew"
          :key="pilot.documentId"
          :pilot="pilot"
        />
      </ul>
    </section>

    <!-- ── Contributors ──
         Everyone who writes for the site without flying the line: no `joinedAt`,
         so they stay out of the crew grid but keep their byline. -->
    <section v-if="roster.contributors.length" class="about-section">
      <AppSectionHeading
        :eyebrow="t('about.contributorsEyebrow')"
        :title="t('about.contributors')"
        class="mb-lg"
      />

      <ul class="grid grid-3 gap-md pilots">
        <AppPilotCard
          v-for="pilot in roster.contributors"
          :key="pilot.documentId"
          :pilot="pilot"
        />
      </ul>
    </section>

    <!-- ── History: the page's one loud element. The year carries it; the
         milestone beside it stays quiet. ── -->
    <section v-if="about?.history?.length" class="about-section">
      <AppSectionHeading
        :eyebrow="t('about.historyEyebrow')"
        :title="t('about.history')"
        class="mb-lg"
      />

      <ol class="timeline">
        <li
          v-for="milestone in about.history"
          :key="`${milestone.year}-${milestone.title}`"
          class="milestone"
        >
          <div class="milestone-year">{{ milestone.year }}</div>
          <div class="milestone-body">
            <h3 class="milestone-title">{{ milestone.title }}</h3>
            <p v-if="milestone.body" class="milestone-text">
              {{ milestone.body }}
            </p>
          </div>
        </li>
      </ol>
    </section>

    <!-- ── Contact ── -->
    <section v-if="hasContact" class="about-section">
      <AppSectionHeading
        :eyebrow="t('about.contactEyebrow')"
        :title="t('about.contact')"
        class="mb-lg"
      />

      <div class="contact-layout">
        <dl
          v-if="contact.email || contact.phone || contact.address"
          class="contact-facts"
        >
          <template v-if="contact.email">
            <dt>{{ t('about.email') }}</dt>
            <dd>
              <a :href="`mailto:${contact.email}`">{{ contact.email }}</a>
            </dd>
          </template>

          <template v-if="contact.phone">
            <dt>{{ t('about.phone') }}</dt>
            <dd>
              <a :href="`tel:${contact.phone.replace(/\s+/g, '')}`">{{
                contact.phone
              }}</a>
            </dd>
          </template>

          <template v-if="contact.address">
            <dt>{{ t('about.address') }}</dt>
            <dd>{{ contact.address }}</dd>
          </template>
        </dl>

        <div v-if="hubs.length" class="hub-list">
          <div class="section-sup">{{ t('about.hubs') }}</div>
          <AppHubStrip :hubs="hubs" class="mt-sm" />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.about-page {
  gap: var(--space-10);
  padding-block: var(--space-8) var(--space-12);
}

.about-title {
  font-family: var(--font-serif);
  font-size: var(--text-display-md);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-tight);
  letter-spacing: -0.3px;
}

.about-section {
  /* One source of truth for the gap between sections: the page's flex `gap`
     already spaces them, so nothing sets a margin here as well. */
  width: 100%;
}

/* ── Crew ──
   Nothing here: the card owns its own styles, including the list marker. See
   AppPilotCard. */

/* ── History ── */
.timeline {
  list-style: none;
  border-inline-start: 1px solid var(--color-border);
}
.milestone {
  display: grid;
  grid-template-columns: 108px 1fr;
  gap: var(--space-5);
  padding-inline-start: var(--space-6);
  padding-block: var(--space-4);
}
.milestone-year {
  font-family: var(--font-serif);
  font-size: var(--text-display-sm);
  font-weight: var(--weight-medium);
  line-height: var(--leading-tight);
  color: var(--color-accent);
  font-variant-numeric: tabular-nums;
}
.milestone-title {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  line-height: var(--leading-snug);
}
.milestone-text {
  font-size: var(--text-md);
  line-height: var(--leading-relaxed);
  font-weight: var(--weight-normal);
  color: var(--color-text-secondary);
  margin-top: var(--space-1);
  overflow-wrap: break-word;
}

/* The two-column milestone is the first thing to break at narrow widths: the
   year stacks above its entry rather than squeezing into a 60px gutter. */
@media (max-width: 560px) {
  .milestone {
    grid-template-columns: 1fr;
    gap: var(--space-1);
    padding-inline-start: var(--space-4);
  }
}

/* ── Contact ── */
.contact-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8);
}
@media (max-width: 720px) {
  .contact-layout {
    grid-template-columns: 1fr;
  }
}

.contact-facts {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-2) var(--space-5);
  font-family: var(--font-sans);
  font-size: var(--text-md);
  align-content: start;
}
.contact-facts dt {
  font-size: var(--text-2xs);
  letter-spacing: var(--tracking-lg);
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  padding-top: var(--space-1);
}
.contact-facts dd {
  overflow-wrap: anywhere;
  font-variant-numeric: tabular-nums;
}
.contact-facts a {
  color: var(--color-accent);
}
</style>

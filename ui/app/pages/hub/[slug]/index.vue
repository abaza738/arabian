<script setup lang="ts">
definePageMeta({
  name: 'hub',
  key: (route) => route.fullPath,
})

const route = useRoute()
const slug = String(route.params.slug ?? '')

const { find } = useCms()
const { t } = useI18n()
const locale = useAppLocale()
const localePath = useLocalePath()

const { data: global } = await useGlobal()

const includeUnassigned = computed(
  () => global.value?.showUnassignedInHubViews === true,
)

const { data, error } = await useAsyncData(
  () => `hub-${slug}-${locale.value}-${includeUnassigned.value}`,
  async () => {
    const now = new Date().toISOString()
    const filters = hubFilter(slug, includeUnassigned.value)

    const ofThisHub = { hub: { slug: { $eq: slug } } }

    const [hubs, articles, events, pilots, fleet] = await Promise.all([
      withLocaleFallback(locale.value, (l) =>
        find('Hubs', {
          locale: l,
          filters: { slug: { $eq: slug } },
          populate: ['location', 'cover'],
          pagination: { limit: 1 },
        }),
      ),
      withLocaleFallback(locale.value, (l) =>
        find('Articles', {
          locale: l,
          filters,
          populate: ['cover', 'category'],
          sort: 'publishedAt:desc',
          pagination: { limit: 6 },
        }),
      ),
      withLocaleFallback(locale.value, (l) =>
        find('Events', {
          locale: l,
          filters: { ...filters, startsAt: { $gte: now } },
          populate: ['location'],
          sort: 'startsAt:asc',
          pagination: { limit: 5 },
        }),
      ),
      withLocaleFallback(locale.value, (l) =>
        find('Pilots', {
          locale: l,
          filters: ofThisHub,
          populate: ['photo'],
          sort: ['order:asc', 'name:asc'],
        }),
      ),
      withLocaleFallback(locale.value, (l) =>
        find('Aircrafts', {
          locale: l,
          filters: ofThisHub,
          populate: ['cover'],
          sort: ['order:asc', 'title:asc'],
        }),
      ),
    ])

    return {
      hub: hubs?.data?.[0] ?? null,
      articles: articles?.data ?? [],
      events: events?.data ?? [],
      pilots: pilots?.data ?? [],
      fleet: fleet?.data ?? [],
    }
  },
  { watch: [locale, includeUnassigned] },
)

const loaded = data.value?.hub

if (error.value || !loaded) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Hub not found',
    fatal: true,
  })
}

const hub = computed(() => data.value?.hub ?? loaded)
const articles = computed(() => data.value?.articles ?? [])
const events = computed(() => data.value?.events ?? [])
const pilots = computed(() => data.value?.pilots ?? [])
const fleet = computed(() => data.value?.fleet ?? [])

const where = computed(() => locationLine(hub.value?.location))

usePageSeo(() => hub.value?.name ?? '', {
  description: () => where.value || undefined,
})
</script>

<template>
  <div v-if="hub" class="inner flex-1 flex flex-col hub-page">
    <NuxtLink :to="localePath({ name: 'about' })" class="back-link">
      <span class="back-arrow">←</span> {{ t('hub.allHubs') }}
    </NuxtLink>

    <header class="hub-header">
      <h1 class="hub-title">{{ hub.name }}</h1>

      <p v-if="hub.intro" class="hub-intro">{{ hub.intro }}</p>

      <img
        v-if="hub.cover"
        :src="mediaUrl(hub.cover.url)"
        :alt="hub.cover.alternativeText ?? hub.name"
        class="hub-cover"
        loading="lazy"
      />

      <dl v-if="where || hub.email || hub.phone" class="hub-facts">
        <template v-if="where">
          <dt>{{ t('event.where') }}</dt>
          <dd>
            {{ where }}
            <a
              v-if="hub.location?.mapUrl"
              :href="hub.location.mapUrl"
              class="about-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ t('event.viewMap') }} <span class="arrow">→</span>
            </a>
          </dd>
        </template>

        <template v-if="hub.email">
          <dt>{{ t('about.email') }}</dt>
          <dd>
            <a :href="`mailto:${hub.email}`">{{ hub.email }}</a>
          </dd>
        </template>

        <template v-if="hub.phone">
          <dt>{{ t('about.phone') }}</dt>
          <dd>
            <a :href="`tel:${hub.phone.replace(/\s+/g, '')}`">
              {{ hub.phone }}
            </a>
          </dd>
        </template>
      </dl>
    </header>

    <section v-if="fleet.length" class="hub-section">
      <AppSectionHeading
        :eyebrow="t('sections.whatWeFly')"
        :title="t('hub.fleet')"
        class="mb-lg"
      />

      <div class="grid grid-3 gap-md">
        <AppAircraftCard
          v-for="aircraft in fleet"
          :key="aircraft.documentId"
          :aircraft="aircraft"
        />
      </div>
    </section>

    <section v-if="pilots.length" class="hub-section">
      <AppSectionHeading
        :eyebrow="t('about.crewEyebrow')"
        :title="t('hub.pilots')"
        class="mb-lg"
      />

      <ul class="grid grid-3 gap-md pilots">
        <AppPilotCard
          v-for="pilot in pilots"
          :key="pilot.documentId"
          :pilot="pilot"
        />
      </ul>
    </section>

    <section class="hub-section">
      <AppSectionHeading
        :eyebrow="t('sections.calendar')"
        :title="t('hub.events')"
        class="mb-md"
      />

      <p v-if="!events.length" class="state-message">
        {{ t('hub.noEvents') }}
      </p>
      <template v-else>
        <div class="flex flex-col event-list">
          <AppEventRow
            v-for="event in events"
            :key="event.documentId"
            :event="event"
          />
        </div>

        <NuxtLink
          :to="localePath({ name: 'hub-events', params: { slug } })"
          class="about-link section-more"
        >
          {{ t('hub.viewAllEvents') }} <span class="arrow">→</span>
        </NuxtLink>
      </template>
    </section>

    <section class="hub-section">
      <AppSectionHeading
        :eyebrow="t('sections.latest')"
        :title="t('hub.news')"
        class="mb-lg"
      />

      <p v-if="!articles.length" class="state-message">
        {{ t('hub.noNews') }}
      </p>
      <template v-else>
        <div class="grid grid-3 gap-md">
          <AppNewsCard
            v-for="article in articles"
            :key="article.documentId"
            :article="article"
          />
        </div>

        <NuxtLink
          :to="localePath({ name: 'hub-news', params: { slug } })"
          class="about-link section-more"
        >
          {{ t('hub.viewAllNews') }} <span class="arrow">→</span>
        </NuxtLink>
      </template>
    </section>
  </div>
</template>

<style scoped>
.hub-page {
  gap: var(--space-8);
  padding-block: var(--space-6) var(--space-12);
}

.back-link {
  align-self: flex-start;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  transition: color var(--transition);
}
.back-link:hover {
  color: var(--color-text);
}
.back-arrow {
  display: inline-block;
}

.hub-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.hub-title {
  font-family: var(--font-serif);
  font-size: var(--text-display-md);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-tight);
  letter-spacing: -0.3px;
}

.hub-intro {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  line-height: var(--leading-loose);
  font-weight: var(--weight-light);
  max-width: 60ch;
}

.hub-cover {
  width: 100%;
  aspect-ratio: 16 / 7;
  object-fit: cover;
  border-radius: var(--radius-md);
}

.hub-facts {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-1-5) var(--space-5);
  padding-block: var(--space-3-5);
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  font-family: var(--font-sans);
  font-size: var(--text-md);
}
.hub-facts dt {
  font-size: var(--text-2xs);
  letter-spacing: var(--tracking-lg);
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  padding-top: var(--space-0-5);
}
.hub-facts dd {
  overflow-wrap: anywhere;
}
.hub-facts a {
  color: var(--color-accent);
}

.event-list {
  gap: var(--space-1);
}

.hub-section {
  display: flex;
  flex-direction: column;
}

.section-more {
  align-self: flex-start;
  margin-top: var(--space-4);
  padding-inline-start: var(--space-4);
}
</style>

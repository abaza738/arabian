<script setup lang="ts">
definePageMeta({
  name: 'destination',
})

const route = useRoute()
const slug = String(route.params.slug ?? '')

const { find } = useCms()
const { t } = useI18n()
const locale = useAppLocale()
const localePath = useLocalePath()

const { data, error } = await useAsyncData(
  () => `destination-${slug}-${locale.value}`,
  () =>
    withLocaleFallback(locale.value, (l) =>
      find('Destinations', {
        locale: l,
        filters: { slug: { $eq: slug } },
        populate: {
          cover: true,
          seo: SEO_POPULATE,
          blocks: { populate: '*' },
        },
        pagination: { limit: 1 },
      }),
    ),
  { watch: [locale] },
)

const loaded = data.value?.data?.[0]

if (error.value || !loaded) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Destination not found',
    fatal: true,
  })
}

const destination = computed(() => data.value?.data?.[0] ?? loaded)

const place = computed(() =>
  [destination.value.city, destination.value.country].filter(Boolean).join(', '),
)

useEntrySeo(() => destination.value, {
  image: () => coverUrl(destination.value, 'large'),
})
</script>

<template>
  <div v-if="destination" class="inner flex-1 flex flex-col destination-page">
    <NuxtLink :to="localePath({ name: 'network' })" class="about-link">
      <span class="back-arrow">←</span> {{ t('destination.all') }}
    </NuxtLink>

    <header class="destination-header">
      <span v-if="place" class="destination-place">{{ place }}</span>
      <h1 class="destination-title">{{ destination.name }}</h1>
      <p v-if="destination.summary" class="destination-summary">
        {{ destination.summary }}
      </p>
    </header>

    <AppPhoto
      v-if="destination.cover"
      :src="coverUrl(destination, 'large')"
      :alt="destination.cover?.alternativeText ?? ''"
      ratio="5 / 2"
      radius="var(--radius-lg)"
    />

    <dl class="destination-facts">
      <template v-if="destination.icao">
        <dt>{{ t('destination.icao') }}</dt>
        <dd>{{ destination.icao }}</dd>
      </template>
      <template v-if="destination.iata">
        <dt>{{ t('destination.iata') }}</dt>
        <dd>{{ destination.iata }}</dd>
      </template>
    </dl>

    <BlockZone :blocks="destination.blocks" />
  </div>
</template>

<style scoped>
.destination-page {
  gap: var(--space-6);
  padding-block: var(--space-8) var(--space-12);
}

.destination-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.destination-place {
  font-size: var(--text-3xs);
  letter-spacing: var(--tracking-base);
  text-transform: uppercase;
  color: var(--color-text-tertiary);
}

.destination-title {
  font-family: var(--font-serif);
  font-size: var(--text-display-md);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-tight);
  letter-spacing: -0.3px;
}

.destination-summary {
  font-size: var(--text-lg);
  font-weight: var(--weight-light);
  line-height: var(--leading-relaxed);
  color: var(--color-text-secondary);
  max-width: 62ch;
}

.destination-facts {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-2) var(--space-5);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-md);

  dt {
    color: var(--color-text-tertiary);
    font-weight: var(--weight-light);
  }
  dd {
    color: var(--color-text-secondary);
    font-variant-numeric: tabular-nums;
  }
}

.destination-facts:empty {
  display: none;
}
</style>

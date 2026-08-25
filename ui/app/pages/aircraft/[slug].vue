<script setup lang="ts">
definePageMeta({
  name: 'aircraft',
})

const route = useRoute()
const slug = String(route.params.slug ?? '')

const { find } = useCms()
const { t, locale: i18nLocale } = useI18n()
const locale = useAppLocale()
const localePath = useLocalePath()

const { data, error } = await useAsyncData(
  () => `aircraft-${slug}-${locale.value}`,
  () =>
    withLocaleFallback(locale.value, (l) =>
      find('Aircrafts', {
        locale: l,
        filters: { slug: { $eq: slug } },
        populate: {
          cover: true,
          hub: true,
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
    statusMessage: 'Aircraft not found',
    fatal: true,
  })
}

const aircraft = computed(() => data.value?.data?.[0] ?? loaded)

const number = (value?: number | null) =>
  typeof value === 'number'
    ? new Intl.NumberFormat(i18nLocale.value).format(value)
    : ''

useEntrySeo(() => aircraft.value, {
  image: () => coverUrl(aircraft.value, 'large'),
})
</script>

<template>
  <div v-if="aircraft" class="inner flex-1 flex flex-col aircraft-page">
    <NuxtLink :to="localePath({ name: 'fleet' })" class="about-link">
      <span class="back-arrow">←</span> {{ t('aircraft.all') }}
    </NuxtLink>

    <header class="aircraft-header">
      <span class="aircraft-status">
        {{ t(`aircraft.status.${aircraft.fleetStatus}`) }}
      </span>
      <h1 class="aircraft-title">{{ aircraft.title }}</h1>
      <p v-if="aircraft.summary" class="aircraft-summary">
        {{ aircraft.summary }}
      </p>
    </header>

    <AppPhoto
      v-if="aircraft.cover"
      :src="coverUrl(aircraft, 'large')"
      :alt="aircraft.cover?.alternativeText ?? ''"
      ratio="5 / 2"
      radius="var(--radius-lg)"
    />

    <dl class="aircraft-facts">
      <template v-if="aircraft.icaoType">
        <dt>{{ t('aircraft.type') }}</dt>
        <dd>{{ aircraft.icaoType }}</dd>
      </template>
      <template v-if="aircraft.registration">
        <dt>{{ t('aircraft.registration') }}</dt>
        <dd>{{ aircraft.registration }}</dd>
      </template>
      <template v-if="aircraft.livery">
        <dt>{{ t('aircraft.livery') }}</dt>
        <dd>{{ aircraft.livery }}</dd>
      </template>
      <template v-if="aircraft.seats">
        <dt>{{ t('aircraft.seats') }}</dt>
        <dd>{{ number(aircraft.seats) }}</dd>
      </template>
      <template v-if="aircraft.rangeNm">
        <dt>{{ t('aircraft.range') }}</dt>
        <dd>{{ t('aircraft.nm', { value: number(aircraft.rangeNm) }) }}</dd>
      </template>
      <template v-if="aircraft.cruiseSpeed">
        <dt>{{ t('aircraft.cruise') }}</dt>
        <dd>{{ t('aircraft.kt', { value: number(aircraft.cruiseSpeed) }) }}</dd>
      </template>
      <template v-if="aircraft.hub?.name">
        <dt>{{ t('aircraft.base') }}</dt>
        <dd>
          <NuxtLink
            :to="
              localePath({
                name: 'hub',
                params: { slug: aircraft.hub.slug },
              })
            "
          >
            {{ aircraft.hub.name }}
          </NuxtLink>
        </dd>
      </template>
    </dl>

    <BlockZone :blocks="aircraft.blocks" />
  </div>
</template>

<style scoped>
.aircraft-page {
  gap: var(--space-6);
  padding-block: var(--space-8) var(--space-12);
}

.aircraft-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.aircraft-status {
  font-size: var(--text-3xs);
  letter-spacing: var(--tracking-base);
  text-transform: uppercase;
  color: var(--color-text-tertiary);
}

.aircraft-title {
  font-family: var(--font-serif);
  font-size: var(--text-display-md);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-tight);
  letter-spacing: -0.3px;
}

.aircraft-summary {
  font-size: var(--text-lg);
  font-weight: var(--weight-light);
  line-height: var(--leading-relaxed);
  color: var(--color-text-secondary);
  max-width: 62ch;
}

.aircraft-facts {
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
  a {
    color: var(--color-accent);
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
}

.aircraft-facts:empty {
  display: none;
}
</style>

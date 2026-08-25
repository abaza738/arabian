<script setup lang="ts">
const { aircraft } = defineProps<{ aircraft: CmsAircraft }>()

const { t, locale } = useI18n()
const localePath = useLocalePath()

const number = (value?: number | null) =>
  typeof value === 'number' ? new Intl.NumberFormat(locale.value).format(value) : ''
</script>

<template>
  <NuxtLink
    :to="localePath({ name: 'aircraft', params: { slug: aircraft.slug } })"
    class="card aircraft-card"
  >
    <AppPhoto
      :src="coverUrl(aircraft)"
      ratio="5 / 2"
      radius="var(--radius-md) var(--radius-md) 0 0"
    />

    <div class="aircraft-body">
      <span class="aircraft-status">
        {{ t(`aircraft.status.${aircraft.fleetStatus}`) }}
      </span>

      <h3 class="aircraft-title">{{ aircraft.title }}</h3>

      <p v-if="aircraft.summary" class="aircraft-summary">
        {{ aircraft.summary }}
      </p>

      <dl class="aircraft-facts">
        <template v-if="aircraft.registration">
          <dt>{{ t('aircraft.registration') }}</dt>
          <dd>{{ aircraft.registration }}</dd>
        </template>
        <template v-if="aircraft.seats">
          <dt>{{ t('aircraft.seats') }}</dt>
          <dd>{{ number(aircraft.seats) }}</dd>
        </template>
        <template v-if="aircraft.rangeNm">
          <dt>{{ t('aircraft.range') }}</dt>
          <dd>{{ t('aircraft.nm', { value: number(aircraft.rangeNm) }) }}</dd>
        </template>
        <template v-if="aircraft.hub?.name">
          <dt>{{ t('aircraft.base') }}</dt>
          <dd>{{ aircraft.hub.name }}</dd>
        </template>
      </dl>
    </div>
  </NuxtLink>
</template>

<style scoped>
.aircraft-card {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
  overflow: hidden;
}

.aircraft-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
}

.aircraft-status {
  font-size: var(--text-3xs);
  letter-spacing: var(--tracking-base);
  text-transform: uppercase;
  color: var(--color-text-tertiary);
}

.aircraft-title {
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  line-height: var(--leading-snug);
  color: var(--color-text);
}

.aircraft-summary {
  font-size: var(--text-sm);
  font-weight: var(--weight-light);
  line-height: var(--leading-normal);
  color: var(--color-text-secondary);
}

.aircraft-facts {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-1) var(--space-3);
  margin-top: var(--space-1);
  font-size: var(--text-xs);

  dt {
    color: var(--color-text-tertiary);
    font-weight: var(--weight-light);
  }
  dd {
    color: var(--color-text-secondary);
    font-variant-numeric: tabular-nums;
  }
}
</style>

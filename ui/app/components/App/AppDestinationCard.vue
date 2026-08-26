<script setup lang="ts">
const { destination } = defineProps<{ destination: CmsDestination }>()

const localePath = useLocalePath()

const place = computed(() =>
  [destination.city, destination.country].filter(Boolean).join(', '),
)
</script>

<template>
  <NuxtLink
    :to="
      localePath({ name: 'destination', params: { slug: destination.slug } })
    "
    class="card destination-card"
  >
    <AppPhoto
      :src="coverUrl(destination)"
      ratio="5 / 2"
      radius="var(--radius-md) var(--radius-md) 0 0"
    />

    <div class="destination-body">
      <span v-if="destination.iata" class="destination-code">
        {{ destination.iata }}
      </span>

      <h3 class="destination-title">{{ destination.name }}</h3>

      <p v-if="place" class="destination-place">{{ place }}</p>

      <p v-if="destination.summary" class="destination-summary">
        {{ destination.summary }}
      </p>
    </div>
  </NuxtLink>
</template>

<style scoped>
.destination-card {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
  overflow: hidden;
}

.destination-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
}

.destination-code {
  font-size: var(--text-3xs);
  letter-spacing: var(--tracking-base);
  color: var(--color-text-tertiary);
}

.destination-title {
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  line-height: var(--leading-snug);
  color: var(--color-text);
}

.destination-place {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.destination-summary {
  font-size: var(--text-sm);
  font-weight: var(--weight-normal);
  line-height: var(--leading-normal);
  color: var(--color-text-secondary);
}
</style>

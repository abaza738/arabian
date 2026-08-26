<script setup lang="ts">
const { block } = defineProps<{ block: CmsStatBandSection }>()

const localePath = useLocalePath()
</script>

<template>
  <section class="stat-band">
    <div class="inner stat-band-layout">
      <div class="stat-band-copy">
        <div v-if="block.eyebrow" class="section-sup">{{ block.eyebrow }}</div>
        <h2 v-if="block.title" class="stat-band-title">{{ block.title }}</h2>
        <p v-if="block.body" class="stat-band-body">{{ block.body }}</p>

        <div v-if="block.linkLabel && block.linkUrl" class="mt-md">
          <NuxtLink
            v-if="block.linkUrl.startsWith('/')"
            :to="localePath(block.linkUrl)"
            class="about-link"
          >
            {{ block.linkLabel }} <span class="arrow">→</span>
          </NuxtLink>
          <a
            v-else-if="externalUrl(block.linkUrl)"
            :href="externalUrl(block.linkUrl)"
            class="about-link"
          >
            {{ block.linkLabel }} <span class="arrow">→</span>
          </a>
        </div>
      </div>

      <div
        v-if="block.stats?.length"
        class="grid grid-2 gap-md stat-band-stats"
      >
        <AppStat
          v-for="stat in block.stats"
          :key="stat.id"
          :value="stat.value"
          :label="stat.label"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.stat-band {
  background: var(--color-surface-subtle);
  padding-block: var(--space-10);
}

.stat-band-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8);
}

.stat-band-title {
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  margin-bottom: var(--space-4);
  line-height: var(--leading-snug);
}

.stat-band-body {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  line-height: var(--leading-loose);
  font-weight: var(--weight-normal);
}

@media (max-width: 900px) {
  .stat-band-layout {
    grid-template-columns: 1fr;
  }
}
</style>

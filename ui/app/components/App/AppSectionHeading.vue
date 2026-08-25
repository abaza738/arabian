<script setup lang="ts">
const {
  eyebrow,
  title,
  small = false,
} = defineProps<{
  eyebrow?: string
  title: string
  small?: boolean
}>()
</script>

<template>
  <div>
    <div v-if="eyebrow" class="section-sup">{{ eyebrow }}</div>
    <h2 class="section-title" :class="{ small }">{{ title }}</h2>
  </div>
</template>

<style scoped>
.section-title {
  font-family: var(--font-serif);
  font-size: var(--text-2xl);
  font-weight: var(--weight-medium);
  color: var(--color-text);
}
.section-title.small {
  font-size: var(--text-lg);
}
</style>

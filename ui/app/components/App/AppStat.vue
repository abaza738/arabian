<script setup lang="ts">
defineProps<{ value: string; label: string }>()
</script>

<template>
  <div>
    <div class="stat-value">{{ value }}</div>
    <div class="stat-label">{{ label }}</div>
  </div>
</template>

<style scoped>
.stat-value {
  font-family: var(--font-serif);
  font-size: var(--text-2xl);
  color: var(--color-text);
}
.stat-label {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin-top: var(--space-px);
}
</style>

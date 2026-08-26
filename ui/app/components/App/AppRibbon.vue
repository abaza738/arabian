<script setup lang="ts">
// Nullable, not just optional: these are CMS fields, and an editor who leaves
// one empty gets `null` back rather than a missing key.
defineProps<{ name?: string | null; tagline?: string | null }>()
</script>

<template>
  <div class="ribbon">
    <div class="inner ribbon-inner">
      <span class="ribbon-name">{{ name }}</span>
      <div class="ribbon-line" />
      <span v-if="tagline" class="ribbon-tag">{{ tagline }}</span>
      <div class="ribbon-dot" />
    </div>
  </div>
</template>

<style scoped>
.ribbon {
  background: var(--color-ink);
}
.ribbon-inner {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--layout-gutter);
}
.ribbon-name {
  font-family: var(--font-serif);
  font-size: var(--text-xs);
  color: var(--color-ink-text);
  letter-spacing: var(--tracking-xs);
}
.ribbon-line {
  flex: 1;
  min-width: var(--space-4);
  height: 1px;
  background: var(--color-ink-muted);
}
.ribbon-tag {
  font-size: var(--text-2xs);
  color: var(--color-ink-text-muted);
  font-weight: var(--weight-normal);
}

@media (max-width: 560px) {
  .ribbon-tag {
    display: none;
  }
}
.ribbon-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-accent);
  opacity: 0.8;
  flex-shrink: 0;
}
</style>

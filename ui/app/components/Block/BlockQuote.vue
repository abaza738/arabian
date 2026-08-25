<script setup lang="ts">
const { block } = defineProps<{ block: CmsQuoteBlock }>()
</script>

<template>
  <blockquote class="block-quote">
    <p class="block-quote-body">{{ block.body }}</p>
    <footer class="block-quote-attribution">— {{ block.title }}</footer>
  </blockquote>
</template>

<style scoped>
.block-quote {
  border-inline-start: 3px solid var(--color-accent);
  padding: var(--space-4) var(--space-6);
  background: var(--color-surface-subtle);
  /* Logical corners: the square edge belongs against the accent rule, which
     moves to the other side in Arabic. */
  border-start-start-radius: 0;
  border-end-start-radius: 0;
  border-start-end-radius: var(--radius-md);
  border-end-end-radius: var(--radius-md);
}

.block-quote-body {
  font-family: var(--font-serif);
  font-size: var(--text-xl);
  font-weight: var(--weight-normal);
  font-style: italic;
  line-height: var(--leading-normal);
  color: var(--color-text);
  margin-bottom: var(--space-3);
}

.block-quote-attribution {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  font-weight: var(--weight-normal);
}
</style>

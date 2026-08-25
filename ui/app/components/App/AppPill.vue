<script setup lang="ts">
// The known hues autocomplete, but any string is accepted: `category.color` is
// the editor's, and an admin can add a value this component has never heard of.
// `(string & {})` is what keeps the literals visible instead of collapsing the
// union to `string`.
defineProps<{
  variant: CmsCategoryColor | 'featured' | (string & {})
}>()
</script>

<template>
  <span class="pill" :data-pill-type="variant">
    <slot />
  </span>
</template>

<style scoped>
.pill {
  display: inline-block;
  border-radius: var(--radius-full);
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-2xs);
  font-weight: var(--weight-normal);
  line-height: var(--leading-normal);

  &[data-pill-type='news'] {
    background: var(--color-pill-news-bg);
    color: var(--color-pill-news-text);
  }
  &[data-pill-type='culture'] {
    background: var(--color-pill-culture-bg);
    color: var(--color-pill-culture-text);
  }
  &[data-pill-type='events'] {
    background: var(--color-pill-events-bg);
    color: var(--color-pill-events-text);
  }
  &[data-pill-type='community'] {
    background: var(--color-pill-community-bg);
    color: var(--color-pill-community-text);
  }
  &[data-pill-type='heritage'] {
    background: var(--color-pill-heritage-bg);
    color: var(--color-pill-heritage-text);
  }
  &[data-pill-type='grey'] {
    background: var(--color-surface-muted);
    color: var(--color-text-secondary);
  }
  &[data-pill-type='featured'] {
    background: var(--color-ink);
    color: var(--color-ink-on);
    font-size: var(--text-3xs);
  }
}
</style>

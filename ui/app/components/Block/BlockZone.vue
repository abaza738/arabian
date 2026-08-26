<script setup lang="ts">
/**
 * Renders a Strapi dynamiczone. Adding a component to a dynamiczone means
 * adding a branch here — this is the one dispatcher, shared by every page that
 * owns a `blocks` field (article, event, aircraft, destination, page) and by
 * the landing page's `sections`.
 *
 * `CmsBlock` is a union discriminated on `__component`, so each branch below
 * narrows to exactly one block type and every renderer takes its own block
 * whole rather than a hand-copied selection of its fields.
 */
const { blocks } = defineProps<{ blocks?: CmsBlock[] }>()
</script>

<template>
  <div v-if="blocks?.length" class="block-zone">
    <template v-for="block in blocks" :key="block.id">
      <BlockRichText
        v-if="block.__component === 'shared.rich-text'"
        :block="block"
      />

      <BlockQuote
        v-else-if="block.__component === 'shared.quote'"
        :block="block"
      />

      <BlockMedia
        v-else-if="block.__component === 'shared.media'"
        :block="block"
      />

      <BlockSlider
        v-else-if="block.__component === 'shared.slider'"
        :block="block"
      />

      <BlockHero
        v-else-if="block.__component === 'sections.hero'"
        :block="block"
      />

      <BlockRibbon
        v-else-if="block.__component === 'sections.ribbon'"
        :block="block"
      />

      <BlockFeature
        v-else-if="block.__component === 'sections.feature'"
        :block="block"
      />

      <BlockFeed
        v-else-if="block.__component === 'sections.feed'"
        :block="block"
      />

      <BlockStatBand
        v-else-if="block.__component === 'sections.stat-band'"
        :block="block"
      />

      <BlockCtaBand
        v-else-if="block.__component === 'sections.cta-band'"
        :block="block"
      />
    </template>
  </div>
</template>

<style scoped>
.block-zone {
  display: flex;
  flex-direction: column;
  gap: var(--space-section);
}
.block-zone > :deep(.ribbon) {
  margin-block: calc(var(--space-section) * -1);
}
</style>

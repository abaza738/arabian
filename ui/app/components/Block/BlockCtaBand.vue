<script setup lang="ts">
const { block } = defineProps<{ block: CmsCtaBandSection }>()
</script>

<template>
  <section v-if="block.cards?.length" class="inner cta-band">
    <AppCtaCard v-for="card in block.cards" :key="card.id" :card="card" />
  </section>
</template>

<style scoped>
.cta-band {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-6);
  padding-block: var(--space-10);
}
</style>

<script setup lang="ts">
const { block } = defineProps<{ block: CmsFeatureSection }>()
</script>

<template>
  <section v-if="block.article" class="inner">
    <AppFeaturedArticle :article="block.article" />
  </section>
</template>

<script setup lang="ts">
const { block } = defineProps<{ block: CmsHeroSection }>()
</script>

<template>
  <AppHero
    v-if="block.hero?.headline"
    :hero="block.hero"
    :background="block.background"
    :decoration="block.decoration"
    :show-scene="block.showScene ?? false"
  />
</template>

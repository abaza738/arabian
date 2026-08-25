<script setup lang="ts">
defineProps<{ block: CmsRibbonSection }>()
</script>

<template>
  <AppRibbon :name="block.name" :tagline="block.tagline" />
</template>

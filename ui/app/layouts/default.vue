<script setup lang="ts">
// Both deduped by useAsyncData, so these are the same requests the landing and
// About pages use.
const { data: global } = await useGlobal()
const { data: hubs } = await useHubs()
// The mega menu's editor-owned column. Fetched here rather than in the panel so
// it is one request for the whole app, like the two above.
const { data: menuPages } = await useMenuPages()

// The hub the reader is inside, or null everywhere else. The nav highlights
// it and the footer swaps its contact column for it.
const hub = useActiveHub(hubs)
</script>

<template>
  <div id="layout-default" class="flex-1 flex flex-col">
    <AppSiteNav
      :global="global"
      :hubs="hubs"
      :pages="menuPages"
      :active-hub="hub"
    />

    <slot />

    <AppSocialStrip :links="global?.socialLinks" />
    <AppSiteFooter :global="global" :hub="hub" />
  </div>
</template>

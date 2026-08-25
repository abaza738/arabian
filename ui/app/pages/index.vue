<script setup lang="ts">
const { findSingle } = useCms()
const locale = useAppLocale()

const { data: home } = await useAsyncData(
  () => `home-${locale.value}`,
  () =>
    withLocaleFallback(locale.value, (l) =>
      findSingle('home', {
        locale: l,
        populate: { sections: { populate: '*' }, seo: SEO_POPULATE },
      }),
    ),
  { watch: [locale] },
)

useEntrySeo(() => home.value?.data ?? null)
</script>

<template>
  <div class="flex-1 flex flex-col">
    <BlockZone :blocks="home?.data?.sections" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  name: 'page',
})

const route = useRoute()
const slug = String(route.params.slug ?? '')

const { find } = useCms()
const locale = useAppLocale()

const { data, error } = await useAsyncData(
  () => `page-${slug}-${locale.value}`,
  () =>
    withLocaleFallback(locale.value, (l) =>
      find('Pages', {
        locale: l,
        filters: { slug: { $eq: slug } },
        populate: { seo: SEO_POPULATE, blocks: { populate: '*' } },
        pagination: { limit: 1 },
      }),
    ),
  { watch: [locale] },
)

const loaded = data.value?.data?.[0]

if (error.value || !loaded) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found',
    fatal: true,
  })
}

// Captured past the guard, so every reader below has an entry rather than a
// nullable one. The computed still re-reads `data`, so a locale switch swaps the
// content; it falls back to this one rather than rendering nothing if the new
// locale has no translation.
const page = computed(() => data.value?.data?.[0] ?? loaded)

useEntrySeo(() => page.value)
</script>

<template>
  <div v-if="page" class="inner flex-1 flex flex-col static-page">
    <h1 class="page-title">{{ page.title }}</h1>

    <BlockZone :blocks="page.blocks" />
  </div>
</template>

<style scoped>
.static-page {
  gap: var(--space-6);
  padding-block: var(--space-8) var(--space-12);
}

.page-title {
  font-family: var(--font-serif);
  font-size: var(--text-display-md);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-tight);
  letter-spacing: -0.3px;
}
</style>

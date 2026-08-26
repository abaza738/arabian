<script setup lang="ts">
definePageMeta({
  name: 'hub-news',
  key: (route) => route.fullPath,
})

const route = useRoute()
const slug = String(route.params.slug ?? '')

const { t } = useI18n()

const { data: global } = await useGlobal()
const includeUnassigned = global.value?.showUnassignedInHubViews === true

const { data: categories } = await useCategories()
const { activeCategory, categoryOptions, categoryFilter, showCategoryBar } =
  useCategoryFilter(categories)

const query = (): CmsQuery<CmsArticle> => ({
  filters: { ...hubFilter(slug, includeUnassigned), ...categoryFilter() },
  populate: ['cover', 'category'],
  sort: 'publishedAt:desc',
})

const { data: hubs } = await useHubs()
const hub = useActiveHub(hubs)

usePageSeo(() =>
  hub.value?.name ? `${hub.value.name} · ${t('nav.news')}` : t('nav.news'),
)
</script>

<template>
  <AppEntryFeed
    collection="Articles"
    :cache-key="`hub-${slug}-news-${includeUnassigned}-${activeCategory ?? 'all'}`"
    :query="query"
    :filtered="!!activeCategory"
    date-field="publishedAt"
    layout="grid"
    :eyebrow="t('sections.latest')"
    :title="t('hub.news')"
    :empty-text="
      activeCategory ? t('states.noArticlesInCategory') : t('hub.noNews')
    "
    :error-text="t('states.newsFailed')"
  >
    <template #filters>
      <AppFilterBar
        v-if="showCategoryBar"
        param="category"
        :options="categoryOptions"
      />
    </template>

    <template #item="{ entry }">
      <AppNewsCard :article="entry" />
    </template>
  </AppEntryFeed>
</template>

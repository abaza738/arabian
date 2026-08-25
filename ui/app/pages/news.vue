<script setup lang="ts">
definePageMeta({
  name: 'news',
})

const { t } = useI18n()

const { data: categories } = await useCategories()
const { activeCategory, categoryOptions, categoryFilter, showCategoryBar } =
  useCategoryFilter(categories)

const query = (): CmsQuery<CmsArticle> => ({
  filters: categoryFilter(),
  populate: ['cover', 'category'],
  sort: 'publishedAt:desc',
})

usePageSeo(() => t('nav.news'))
</script>

<template>
  <AppEntryFeed
    collection="Articles"
    :cache-key="`news-${activeCategory ?? 'all'}`"
    :query="query"
    :filtered="!!activeCategory"
    date-field="publishedAt"
    layout="grid"
    :eyebrow="t('sections.latest')"
    :title="t('nav.news')"
    :empty-text="
      activeCategory ? t('states.noArticlesInCategory') : t('states.noArticles')
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

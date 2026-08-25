<script setup lang="ts">
const { article } = defineProps<{ article: CmsArticle }>()

const localePath = useLocalePath()
const { locale } = useI18n()
</script>

<template>
  <NuxtLink
    :to="localePath({ name: 'article', params: { id: article.documentId } })"
    class="card news-card"
  >
    <AppPhoto
      :src="coverUrl(article)"
      ratio="5 / 2"
      radius="var(--radius-md) var(--radius-md) 0 0"
    />

    <div class="news-card-body">
      <AppPill v-if="article.category" :variant="categoryVariant(article)">
        {{ article.category.name }}
      </AppPill>
      <div class="news-card-title">{{ article.title }}</div>
      <div v-if="article.description" class="news-card-excerpt">
        {{ article.description }}
      </div>
      <div v-if="article.publishedAt" class="news-card-meta">
        {{ formatDate(article.publishedAt, locale) }}
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
.news-card {
  display: block;
}
.news-card-body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3-5) var(--space-4) var(--space-5);
}
.news-card-title {
  font-family: var(--font-serif);
  font-size: var(--text-base);
  font-weight: var(--weight-normal);
  line-height: var(--leading-normal);
  color: var(--color-text);
}
.news-card-meta {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}
</style>

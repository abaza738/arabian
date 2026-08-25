<script setup lang="ts">
const { article } = defineProps<{ article: CmsArticle }>()

const localePath = useLocalePath()
const { t } = useI18n()
</script>

<template>
  <NuxtLink
    :to="localePath({ name: 'article', params: { id: article.documentId } })"
    class="card spotlight"
  >
    <AppPhoto
      :src="coverUrl(article)"
      ratio="2 / 1"
      radius="var(--radius-md) var(--radius-md) 0 0"
    />

    <div class="spotlight-body">
      <AppPill v-if="article.category" :variant="categoryVariant(article)">
        {{ article.category.name }}
      </AppPill>
      <div class="spotlight-title">{{ article.title }}</div>
      <div v-if="article.description" class="news-card-excerpt">
        {{ article.description }}
      </div>
      <span class="about-link">
        {{ t('actions.readFeature') }} <span class="arrow">→</span>
      </span>
    </div>
  </NuxtLink>
</template>

<style scoped>
.spotlight {
  display: block;
}
.spotlight-body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-3-5) var(--space-4);
}
.spotlight-title {
  font-family: var(--font-serif);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  color: var(--color-text);
}
</style>

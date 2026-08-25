<script setup lang="ts">
const { article } = defineProps<{ article: CmsArticle }>()

const { t, locale } = useI18n()
const localePath = useLocalePath()

const to = computed(() =>
  localePath({ name: 'article', params: { id: article.documentId } }),
)
</script>

<template>
  <section id="featured">
    <div class="flex gap-lg featured-grid">
      <AppPhoto
        :src="coverUrl(article, 'medium')"
        :alt="article.cover?.alternativeText ?? ''"
        ratio="4 / 3"
        radius="var(--radius-lg)"
        class="featured-image"
      />

      <div class="content">
        <div class="flex flex-wrap gap-sm">
          <AppPill variant="featured">{{ t('sections.featured') }}</AppPill>
          <AppPill v-if="article.category" :variant="categoryVariant(article)">
            {{ article.category.name }}
          </AppPill>
        </div>

        <NuxtLink :to="to">
          <!-- h2, not h1: the hero above carries the page's only h1. -->
          <h2 class="featured-title">{{ article.title }}</h2>
        </NuxtLink>

        <p class="featured-excerpt">{{ article.description }}</p>

        <div class="flex items-center gap-md">
          <AppButton :to="to">
            {{ t('actions.readMore') }} <span class="arrow">→</span>
          </AppButton>

          <span v-if="article.publishedAt" class="text-faint text-sm">
            {{ formatDate(article.publishedAt, locale) }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.featured-grid {
  align-items: center;
}
.featured-image {
  flex: 3;
  min-width: 0;
  border-radius: var(--radius-lg);
}
.featured-title {
  font-family: var(--font-serif);
  font-size: var(--text-display-sm);
  font-weight: var(--weight-medium);
  line-height: var(--leading-snug);
  color: var(--color-text);
  letter-spacing: -0.2px;
}
.content {
  flex: 2;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3-5);
}
.featured-excerpt {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  line-height: var(--leading-loose);
}

@media (max-width: 720px) {
  .featured-grid {
    flex-direction: column;
  }
  .featured-image {
    width: 100%;
  }
}
</style>

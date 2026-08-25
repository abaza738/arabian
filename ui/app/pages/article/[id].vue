<script setup lang="ts">
definePageMeta({
  name: 'article',
})

const route = useRoute()
const articleId = String(route.params.id ?? '')

if (!articleId) {
  throw createError({ statusCode: 404, statusMessage: 'No article ID' })
}

const { findOne } = useCms()
const locale = useAppLocale()
const localePath = useLocalePath()

const { data, error } = await useAsyncData(
  () => `article-${articleId}-${locale.value}`,
  () =>
    withLocaleFallback(locale.value, (l) =>
      findOne('Articles', articleId, {
        locale: l,
        populate: {
          cover: true,
          author: true,
          category: true,
          hub: true,
          seo: SEO_POPULATE,
          blocks: { populate: '*' },
        },
      }),
    ),
  { watch: [locale] },
)

const article = computed(() => data.value?.data ?? null)

if (error.value || !article.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Article not found',
    fatal: true,
  })
}

const { shareImage } = useEntrySeo(() => article.value, {
  image: () => coverUrl(article.value, 'large'),
})

useSeoMeta({ ogType: 'article' })

const schemaImage = shareImage()

const newsArticle = computed(() => ({
  '@type': 'NewsArticle' as const,
  headline: article.value?.title ?? undefined,
  description: article.value?.description ?? undefined,
  image: schemaImage,
  datePublished: article.value?.publishedAt ?? undefined,
  dateModified: article.value?.updatedAt ?? undefined,
  author: article.value?.author?.name
    ? { name: article.value.author.name }
    : undefined,
}))

useSchemaOrg([defineArticle(newsArticle)])
</script>

<template>
  <div class="inner flex flex-col article-page">
    <template v-if="article">
      <!-- Cover -->
      <AppPhoto
        :src="coverUrl(article, 'large')"
        :alt="article.cover?.alternativeText ?? ''"
        ratio="2 / 1"
        radius="var(--radius-lg)"
      />

      <!-- Header -->
      <header class="article-header">
        <AppPill v-if="article.category" :variant="categoryVariant(article)">
          {{ article.category.name }}
        </AppPill>

        <h1 class="article-title">{{ article.title }}</h1>
        <p v-if="article.description" class="article-description">
          {{ article.description }}
        </p>

        <div class="article-meta">
          <span v-if="article.author">{{ article.author.name }}</span>
          <span
            v-if="article.author && article.publishedAt"
            class="article-meta-sep"
            >·</span
          >
          <time v-if="article.publishedAt">
            {{ formatDate(article.publishedAt, locale) }}
          </time>

          <NuxtLink
            v-if="article.hub?.slug"
            :to="
              localePath({
                name: 'hub',
                params: { slug: article.hub.slug },
              })
            "
            class="hub-chip"
          >
            <AppPill variant="grey">{{ article.hub.name }}</AppPill>
          </NuxtLink>
        </div>
      </header>

      <BlockZone :blocks="article.blocks" />
    </template>
  </div>
</template>

<style scoped>
.article-page {
  gap: var(--space-8);
  padding-block: var(--space-8);
}

.article-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3-5);
}

.article-title {
  font-size: var(--text-display-lg);
  color: var(--color-text);
}

.article-description {
  font-size: var(--text-lg);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
}

.article-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}

.article-meta-sep {
  opacity: 0.5;
}

.hub-chip {
  text-decoration: none;
}
</style>

<script setup lang="ts">
definePageMeta({
  name: 'announcement',
})

const route = useRoute()
const announcementId = String(route.params.id ?? '')

if (!announcementId) {
  throw createError({ statusCode: 404, statusMessage: 'No announcement ID' })
}

const { findOne } = useCms()
const { t } = useI18n()
const locale = useAppLocale()
const localePath = useLocalePath()

const { data, error } = await useAsyncData(
  () => `announcement-${announcementId}-${locale.value}`,
  () =>
    withLocaleFallback(locale.value, (l) =>
      findOne('Announcements', announcementId, {
        locale: l,
        populate: { hub: true, seo: SEO_POPULATE },
      }),
    ),
  { watch: [locale] },
)

const loaded = data.value?.data

if (error.value || !loaded) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Announcement not found',
    fatal: true,
  })
}

const announcement = computed(() => data.value?.data ?? loaded)

const hasExpired = computed(
  () =>
    !!announcement.value.expiresAt &&
    new Date(announcement.value.expiresAt) < new Date(),
)

const published = computed(() =>
  announcement.value.publishedAt
    ? new Intl.DateTimeFormat(locale.value, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(announcement.value.publishedAt))
    : '',
)

useEntrySeo(() => announcement.value)
</script>

<template>
  <div v-if="announcement" class="inner flex-1 flex flex-col ann-page">
    <NuxtLink :to="localePath({ name: 'announcements' })" class="about-link">
      <span class="back-arrow">←</span> {{ t('announcement.all') }}
    </NuxtLink>

    <header class="ann-header">
      <div class="ann-meta">
        <span class="ann-kind" :data-kind="announcement.kind">
          {{ t(`announcement.kind.${announcement.kind}`) }}
        </span>
        <span v-if="published">{{ published }}</span>
        <span v-if="announcement.hub?.name">
          · {{ announcement.hub.name }}
        </span>
      </div>

      <h1 class="ann-title">{{ announcement.title }}</h1>
    </header>

    <p v-if="hasExpired" class="ann-expired">
      {{ t('announcement.expired') }}
    </p>

    <Markdown
      v-if="announcement.body"
      :value="announcement.body"
      class="ann-body"
    />
  </div>
</template>

<style scoped>
.ann-page {
  gap: var(--space-5);
  padding-block: var(--space-8) var(--space-12);
  max-width: 72ch;
}

.ann-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.ann-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--weight-normal);
  color: var(--color-text-tertiary);
}

.ann-kind {
  padding: 1px var(--space-2);
  border-radius: var(--radius-full);
  background: var(--color-surface-muted);
  font-size: var(--text-3xs);
  letter-spacing: var(--tracking-base);
  text-transform: uppercase;
}
.ann-kind[data-kind='urgent'] {
  background: var(--color-notice-stop-bg);
  color: var(--color-notice-stop-text);
}
.ann-kind[data-kind='congratulation'] {
  background: var(--color-support-muted);
}

.ann-title {
  font-family: var(--font-serif);
  font-size: var(--text-display-md);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-tight);
  letter-spacing: -0.3px;
}

.ann-expired {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-sm);
  background: var(--color-notice-warn-bg);
  color: var(--color-notice-warn-text);
  font-size: var(--text-sm);
}

.ann-body {
  font-size: var(--text-base);
  font-weight: var(--weight-normal);
  line-height: var(--leading-loose);
  color: var(--color-text-secondary);

  :deep(p + p) {
    margin-top: var(--space-4);
  }
  :deep(strong) {
    font-weight: var(--weight-medium);
    color: var(--color-text);
  }
}
</style>

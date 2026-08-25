<script setup lang="ts">
const { announcement } = defineProps<{ announcement: CmsAnnouncement }>()

const { t, locale } = useI18n()
const localePath = useLocalePath()

const date = computed(() =>
  announcement.publishedAt
    ? new Intl.DateTimeFormat(locale.value, {
        day: 'numeric',
        month: 'short',
      }).format(new Date(announcement.publishedAt))
    : '',
)
</script>

<template>
  <NuxtLink
    :to="
      localePath({
        name: 'announcement',
        params: { id: announcement.documentId },
      })
    "
    class="ann-row"
    :data-kind="announcement.kind"
  >
    <div class="ann-head">
      <span class="ann-kind">{{
        t(`announcement.kind.${announcement.kind}`)
      }}</span>
      <span v-if="announcement.pinned" class="ann-pin">
        {{ t('announcement.pinned') }}
      </span>
      <span v-if="date" class="ann-date">{{ date }}</span>
    </div>

    <h3 class="ann-title">{{ announcement.title }}</h3>
  </NuxtLink>
</template>

<style scoped>
.ann-row {
  display: block;
  padding: var(--space-3) var(--space-4);
  border-inline-start: 2px solid var(--color-border);
  text-decoration: none;
  color: inherit;
  transition: background var(--transition);
}
.ann-row:hover {
  background: var(--color-surface-subtle);
}

.ann-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
}

.ann-kind {
  font-size: var(--text-3xs);
  letter-spacing: var(--tracking-base);
  text-transform: uppercase;
  color: var(--color-text-tertiary);
}

.ann-pin {
  padding: 1px var(--space-2);
  border-radius: var(--radius-full);
  background: var(--color-accent-muted);
  color: var(--color-text);
  font-size: var(--text-3xs);
  letter-spacing: var(--tracking-sm);
  text-transform: uppercase;
}

.ann-date {
  margin-inline-start: auto;
  font-size: var(--text-2xs);
  font-weight: var(--weight-light);
  color: var(--color-text-tertiary);
}

.ann-title {
  font-family: var(--font-serif);
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  line-height: var(--leading-snug);
  color: var(--color-text);
  overflow-wrap: break-word;
}

.ann-row[data-kind='condolence'] .ann-title {
  font-weight: var(--weight-normal);
  color: var(--color-text-secondary);
}
.ann-row[data-kind='urgent'] {
  border-inline-start-color: var(--color-notice-stop-text);
}
.ann-row[data-kind='urgent'] .ann-kind {
  color: var(--color-notice-stop-text);
}
.ann-row[data-kind='congratulation'] {
  border-inline-start-color: var(--color-gold);
}
</style>

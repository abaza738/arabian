<script setup lang="ts">
const { document: doc } = defineProps<{ document: CmsDocument }>()

const { t, locale } = useI18n()

const href = computed(() => mediaUrl(doc.file?.url))

// Strapi records `size` in kilobytes as a decimal.
const size = computed(() => {
  const kb = doc.file?.size
  if (typeof kb !== 'number') return ''
  return kb >= 1024
    ? `${(kb / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(kb))} KB`
})

const type = computed(() =>
  (doc.file?.ext ?? '').replace('.', '').toUpperCase(),
)

const published = computed(() =>
  doc.publishedOn
    ? new Intl.DateTimeFormat(locale.value, {
        year: 'numeric',
        month: 'long',
      }).format(new Date(doc.publishedOn))
    : '',
)
</script>

<template>
  <a
    v-if="href"
    :href="href"
    class="doc-row"
    target="_blank"
    rel="noopener noreferrer"
  >
    <div class="doc-main">
      <div class="doc-head">
        <span class="doc-category">
          {{ t(`document.category.${doc.category}`) }}
        </span>
        <span v-if="published" class="doc-date">{{ published }}</span>
      </div>

      <h3 class="doc-title">
        {{ doc.title }}
        <span class="sr-only"> ({{ t('document.newTab') }})</span>
      </h3>

      <p v-if="doc.description" class="doc-description">
        {{ doc.description }}
      </p>
    </div>

    <div class="doc-file">
      <span v-if="type" class="doc-type">{{ type }}</span>
      <span v-if="size" class="doc-size">{{ size }}</span>
    </div>
  </a>
</template>

<style scoped>
.doc-row {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3-5) var(--space-4);
  border-radius: 10px;
  text-decoration: none;
  color: inherit;
  transition: background var(--transition);
}
.doc-row:hover {
  background: var(--color-surface-subtle);
}

.doc-main {
  flex: 1;
  min-width: 0;
}

.doc-head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
}

.doc-category {
  font-size: var(--text-3xs);
  letter-spacing: var(--tracking-base);
  text-transform: uppercase;
  color: var(--color-text-tertiary);
}

.doc-date {
  font-size: var(--text-2xs);
  font-weight: var(--weight-light);
  color: var(--color-text-tertiary);
}

.doc-title {
  font-family: var(--font-serif);
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  line-height: var(--leading-snug);
  color: var(--color-text);
  overflow-wrap: break-word;
}

.doc-description {
  margin-top: var(--space-1);
  font-size: var(--text-sm);
  font-weight: var(--weight-light);
  line-height: var(--leading-normal);
  color: var(--color-text-secondary);
}

.doc-file {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-px);
  flex-shrink: 0;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}
.doc-type {
  font-size: var(--text-2xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-secondary);
}
.doc-size {
  font-size: var(--text-3xs);
  font-weight: var(--weight-light);
  color: var(--color-text-tertiary);
}
</style>

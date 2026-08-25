<script setup lang="ts">
definePageMeta({
  name: 'documents',
})

const { t } = useI18n()

// Sorted by category so like documents cluster, newest first inside each. The
// category is a chip on the row rather than a heading over a group: a site
// publishes a handful of these, and headings over runs of one read as clutter.
// ponytail: give `AppEntryFeed` a general `groupBy` if a fork's list ever grows
// past a screenful.
const query = (): CmsQuery<CmsDocument> => ({
  populate: ['file'],
  sort: ['category:asc', 'publishedOn:desc'],
})

usePageSeo(() => t('nav.documents'))
</script>

<template>
  <AppEntryFeed
    collection="Documents"
    cache-key="documents"
    :query="query"
    layout="list"
    :eyebrow="t('sections.papers')"
    :title="t('nav.documents')"
    :empty-text="t('states.noDocuments')"
    :error-text="t('states.documentsFailed')"
  >
    <template #item="{ entry }">
      <AppDocumentRow :document="entry" />
    </template>
  </AppEntryFeed>
</template>

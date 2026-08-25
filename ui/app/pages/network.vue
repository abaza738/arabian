<script setup lang="ts">
definePageMeta({
  name: 'network',
})

const { t } = useI18n()

const query = (): CmsQuery<CmsDestination> => ({
  populate: ['cover'],
  sort: ['order:asc', 'name:asc'],
})

usePageSeo(() => t('nav.network'))
</script>

<template>
  <AppEntryFeed
    collection="Destinations"
    cache-key="network"
    :query="query"
    layout="grid"
    :eyebrow="t('sections.whereWeFly')"
    :title="t('nav.network')"
    :empty-text="t('states.noDestinations')"
    :error-text="t('states.networkFailed')"
  >
    <template #item="{ entry }">
      <AppDestinationCard :destination="entry" />
    </template>
  </AppEntryFeed>
</template>

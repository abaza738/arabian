<script setup lang="ts">
definePageMeta({
  name: 'fleet',
})

const { t } = useI18n()

const query = (): CmsQuery<CmsAircraft> => ({
  populate: ['cover', 'hub'],
  sort: ['order:asc', 'title:asc'],
})

usePageSeo(() => t('nav.fleet'))
</script>

<template>
  <AppEntryFeed
    collection="Aircrafts"
    cache-key="fleet"
    :query="query"
    layout="grid"
    :eyebrow="t('sections.whatWeFly')"
    :title="t('nav.fleet')"
    :empty-text="t('states.noAircraft')"
    :error-text="t('states.fleetFailed')"
  >
    <template #item="{ entry }">
      <AppAircraftCard :aircraft="entry" />
    </template>
  </AppEntryFeed>
</template>

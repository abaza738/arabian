<script setup lang="ts">
definePageMeta({
  name: 'roster',
})

const { t } = useI18n()

const query = (): CmsQuery<CmsPilot> => ({
  populate: ['photo', 'rank'],
  filters: { joinedAt: { $notNull: true } },
  sort: ['order:asc', 'name:asc'],
})

usePageSeo(() => t('nav.roster'))
</script>

<template>
  <AppEntryFeed
    collection="Pilots"
    cache-key="roster"
    :query="query"
    layout="grid"
    :eyebrow="t('sections.whoFlies')"
    :title="t('nav.roster')"
    :empty-text="t('states.noPilots')"
    :error-text="t('states.rosterFailed')"
  >
    <template #item="{ entry }">
      <AppPilotCard :pilot="entry" />
    </template>
  </AppEntryFeed>
</template>

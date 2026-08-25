<script setup lang="ts">
definePageMeta({
  name: 'events',
})

const { t } = useI18n()

const { past, whenOptions, eventFilter, eventSort } = useEventWhen()

const query = (): CmsQuery<CmsEvent> => ({
  filters: eventFilter(),
  sort: eventSort(),
  // A component is absent unless populated, and the row prints the venue.
  populate: ['location'],
})

usePageSeo(() => t('nav.events'))
</script>

<template>
  <AppEntryFeed
    collection="Events"
    :cache-key="`events-${past ? 'past' : 'upcoming'}`"
    :query="query"
    :filtered="past"
    date-field="startsAt"
    layout="list"
    :eyebrow="past ? t('sections.archive') : t('sections.calendar')"
    :title="t('nav.events')"
    :empty-text="past ? t('states.noPastEvents') : t('states.noEvents')"
    :error-text="t('states.eventsFailed')"
  >
    <template #filters>
      <AppFilterBar param="when" :options="whenOptions" />
    </template>

    <template #item="{ entry }">
      <AppEventRow :event="entry" />
    </template>
  </AppEntryFeed>
</template>

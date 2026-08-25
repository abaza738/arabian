<script setup lang="ts">
definePageMeta({
  name: 'hub-events',
  // See hub/[slug]/index.vue: without this, switching hubs in the nav
  // bar reuses this component and keeps the previous hub's events.
  key: (route) => route.fullPath,
})

const route = useRoute()
const slug = String(route.params.slug ?? '')

const { t } = useI18n()

const { data: global } = await useGlobal()
const includeUnassigned = global.value?.showUnassignedInHubViews === true

const { past, whenOptions, eventFilter, eventSort } = useEventWhen()

const query = (): CmsQuery<CmsEvent> => ({
  filters: {
    ...hubFilter(slug, includeUnassigned),
    ...eventFilter(),
  },
  sort: eventSort(),
  populate: ['location'],
})

const { data: hubs } = await useHubs()
const hub = useActiveHub(hubs)

usePageSeo(() =>
  hub.value?.name
    ? `${hub.value.name} · ${t('nav.events')}`
    : t('nav.events'),
)
</script>

<template>
  <AppEntryFeed
    collection="Events"
    :cache-key="`hub-${slug}-events-${includeUnassigned}-${past ? 'past' : 'upcoming'}`"
    :query="query"
    :filtered="past"
    date-field="startsAt"
    layout="list"
    :eyebrow="past ? t('sections.archive') : t('sections.calendar')"
    :title="t('hub.events')"
    :empty-text="past ? t('hub.noPastEvents') : t('hub.noEvents')"
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

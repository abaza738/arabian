<script setup lang="ts">
definePageMeta({
  name: 'announcements',
})

const { t } = useI18n()

// Frozen for the life of the page, for the reason `events.vue` freezes its own
// clock: page 2 is an offset into the result set page 1 came from, and a notice
// expiring between the two requests would shift every offset by one and drop a
// row at the seam.
const now = useState('announcements-now', () => new Date().toISOString()).value

// An expired notice is gone, not struck through — that is the difference
// between this type and an article. `$null` has to be spelled out alongside the
// comparison, or Strapi drops every announcement that never expires at all.
const query = (): CmsQuery<CmsAnnouncement> => ({
  filters: {
    $or: [{ expiresAt: { $null: true } }, { expiresAt: { $gt: now } }],
  },
  // Pinned first, then newest. An urgent notice is pinned precisely so it does
  // not sink under the week's condolences.
  sort: ['pinned:desc', 'publishedAt:desc'],
})

usePageSeo(() => t('nav.announcements'))
</script>

<template>
  <AppEntryFeed
    collection="Announcements"
    cache-key="announcements"
    :query="query"
    date-field="publishedAt"
    layout="list"
    :eyebrow="t('sections.noticeboard')"
    :title="t('nav.announcements')"
    :empty-text="t('states.noAnnouncements')"
    :error-text="t('states.announcementsFailed')"
  >
    <template #item="{ entry }">
      <AppAnnouncementRow :announcement="entry" />
    </template>
  </AppEntryFeed>
</template>

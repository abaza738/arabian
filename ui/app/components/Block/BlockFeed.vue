<script setup lang="ts">
const { block } = defineProps<{ block: CmsFeedSection }>()

const { find } = useCms()
const locale = useAppLocale()
const localePath = useLocalePath()

const limit = computed(() => block.limit ?? 4)

const { data: feed } = await useAsyncData(
  () => `feed-${block.id}-${block.source}-${limit.value}-${locale.value}`,
  async () => {
    const page = { limit: limit.value }

    switch (block.source) {
      case 'events': {
        const res = await withLocaleFallback(locale.value, (l) =>
          find('Events', {
            locale: l,
            filters: { startsAt: { $gte: new Date().toISOString() } },
            populate: ['location'],
            sort: 'startsAt:asc',
            pagination: page,
          }),
        )
        return { source: 'events', items: res?.data ?? [] } as const
      }
      case 'aircraft': {
        const res = await withLocaleFallback(locale.value, (l) =>
          find('Aircrafts', {
            locale: l,
            populate: ['cover', 'hub'],
            sort: ['order:asc', 'title:asc'],
            pagination: page,
          }),
        )
        return { source: 'aircraft', items: res?.data ?? [] } as const
      }
      case 'destinations': {
        const res = await withLocaleFallback(locale.value, (l) =>
          find('Destinations', {
            locale: l,
            populate: ['cover'],
            sort: ['order:asc', 'name:asc'],
            pagination: page,
          }),
        )
        return { source: 'destinations', items: res?.data ?? [] } as const
      }
      case 'pilots': {
        const res = await withLocaleFallback(locale.value, (l) =>
          find('Pilots', {
            locale: l,
            filters: { joinedAt: { $notNull: true } },
            populate: ['photo', 'rank'],
            sort: ['order:asc', 'name:asc'],
            pagination: page,
          }),
        )
        return { source: 'pilots', items: res?.data ?? [] } as const
      }
      case 'announcements': {
        const res = await withLocaleFallback(locale.value, (l) =>
          find('Announcements', {
            locale: l,
            sort: ['pinned:desc', 'publishedAt:desc'],
            pagination: page,
          }),
        )
        return { source: 'announcements', items: res?.data ?? [] } as const
      }
      case 'documents': {
        const res = await withLocaleFallback(locale.value, (l) =>
          find('Documents', {
            locale: l,
            populate: ['file'],
            sort: 'publishedOn:desc',
            pagination: page,
          }),
        )
        return { source: 'documents', items: res?.data ?? [] } as const
      }
      default: {
        const res = await withLocaleFallback(locale.value, (l) =>
          find('Articles', {
            locale: l,
            populate: ['cover', 'category'],
            sort: 'publishedAt:desc',
            pagination: page,
          }),
        )
        return { source: 'articles', items: res?.data ?? [] } as const
      }
    }
  },
  { watch: [locale] },
)

const hasItems = computed(() => (feed.value?.items.length ?? 0) > 0)

const layoutClass = computed(() =>
  block.layout === 'list' ? 'flex flex-col feed-list' : 'grid grid-3 gap-md',
)
</script>

<template>
  <section v-if="hasItems && feed" class="inner feed-section">
    <AppSectionHeading
      v-if="block.title"
      :eyebrow="block.eyebrow ?? undefined"
      :title="block.title"
      class="mb-lg"
    />

    <div :class="layoutClass">
      <template v-if="feed.source === 'articles'">
        <AppNewsCard
          v-for="entry in feed.items"
          :key="entry.documentId"
          :article="entry"
        />
      </template>

      <template v-else-if="feed.source === 'events'">
        <AppEventRow
          v-for="entry in feed.items"
          :key="entry.documentId"
          :event="entry"
        />
      </template>

      <template v-else-if="feed.source === 'aircraft'">
        <AppAircraftCard
          v-for="entry in feed.items"
          :key="entry.documentId"
          :aircraft="entry"
        />
      </template>

      <template v-else-if="feed.source === 'destinations'">
        <AppDestinationCard
          v-for="entry in feed.items"
          :key="entry.documentId"
          :destination="entry"
        />
      </template>

      <template v-else-if="feed.source === 'pilots'">
        <AppPilotCard
          v-for="entry in feed.items"
          :key="entry.documentId"
          :pilot="entry"
        />
      </template>

      <template v-else-if="feed.source === 'announcements'">
        <AppAnnouncementRow
          v-for="entry in feed.items"
          :key="entry.documentId"
          :announcement="entry"
        />
      </template>

      <template v-else-if="feed.source === 'documents'">
        <AppDocumentRow
          v-for="entry in feed.items"
          :key="entry.documentId"
          :document="entry"
        />
      </template>
    </div>

    <div v-if="block.ctaLabel && block.ctaUrl" class="feed-cta">
      <AppButton variant="outline" :to="localePath(block.ctaUrl)">
        {{ block.ctaLabel }} <span class="arrow">→</span>
      </AppButton>
    </div>
  </section>
</template>

<style scoped>
.feed-section {
  padding-block: var(--space-6);
}

.feed-list {
  gap: var(--space-1);
}

.feed-cta {
  margin-top: var(--space-6);
}
</style>

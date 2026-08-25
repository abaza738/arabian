<script setup lang="ts" generic="C extends CmsCollection">
/**
 * One date-grouped, paginated feed page. Every list route in the site is this
 * component plus a query: /news, /events and their hub-scoped twins, and
 * whatever archive comes next (a category, a tag, an author).
 *
 * It owns the fetch, the three states, the month headings, Load more and the
 * page's own styles. What it deliberately does not own is what a row looks like
 * — that arrives through the `item` slot — or any i18n key, so the calling page
 * keeps its own copy.
 *
 * Generic over the collection, and `collection` is the only prop that carries
 * it: naming the endpoint types the query, the date field and the entry handed
 * to the slot, so a page never states which content type it is feeding twice.
 */
const props = defineProps<{
  /** Strapi collection, capitalised plural: "Articles", "Events". */
  collection: C
  /**
   * `useStrapiList` cache key. Scoped feeds must fold their scope into it —
   * and so must a filtered one, or the feed keeps the result it fetched under
   * the previous filter.
   */
  cacheKey: string
  /** Everything the feeds differ by: filters, sort, populate. */
  query: () => CmsQuery<CmsEntryOf<C>>
  /**
   * True while the reader has narrowed the feed themselves — a category, the
   * archive. A hub feed is *not* filtered in this sense: its scope comes
   * from the route, not from a control. It turns the locale fallback off, so
   * "no Arabic articles in this category" stops answering in English.
   */
  filtered?: boolean
  /**
   * Which date field the month headings group on. Omit it for a feed that is
   * not chronological — the fleet and documents are ordered by hand and by
   * category, and a month heading over them would be noise.
   */
  dateField?: keyof CmsEntryOf<C> & string
  /** Cards in a grid, or rows in a column. */
  layout?: 'grid' | 'list'
  eyebrow: string
  title: string
  emptyText: string
  errorText: string
}>()

defineSlots<{
  filters?: () => unknown
  item: (props: { entry: CmsEntryOf<C> }) => unknown
}>()

const { t, locale } = useI18n()

// Top-level await makes this an async component; Nuxt's page-level <Suspense>
// resolves it during SSR, so page 1 still arrives in the server-rendered HTML.
const { items, hasMore, pending, error, loadMore } = await useStrapiList(
  props.collection,
  // A getter, not the value: the key changes when the page folds a filter into
  // it, and that is what refetches page 1.
  () => props.cacheKey,
  props.query,
  { filtered: () => props.filtered === true },
)

// Resolved in one pass rather than per row: a heading depends on the entry
// before it, which is what keeps them from repeating across a `loadMore()`
// append — the list stays one flat growing array.
const headings = computed(() => {
  const field = props.dateField
  if (!field) return []

  return items.value.map((entry, i) => {
    const value = entry[field]
    return startsMonth(items.value, i, field) && typeof value === 'string'
      ? monthLabel(value, locale.value)
      : null
  })
})
</script>

<template>
  <div class="inner flex-1 flex flex-col entry-feed">
    <AppSectionHeading :eyebrow="eyebrow" :title="title" class="mb-lg" />

    <!-- Above the three states, never inside one: a reader who filtered their
         way into an empty feed needs the control that got them there. -->
    <slot name="filters" />

    <p v-if="error" class="state-message">{{ errorText }}</p>

    <!-- Empty is a state, not a failure: no Load more, no heading over nothing. -->
    <p v-else-if="!items.length" class="state-message">{{ emptyText }}</p>

    <template v-else>
      <div
        :class="
          layout === 'list'
            ? 'flex flex-col entry-list'
            : 'grid grid-3 gap-md entry-grid'
        "
      >
        <template v-for="(entry, i) in items" :key="entry.documentId">
          <h2 v-if="headings[i]" class="month-heading">{{ headings[i] }}</h2>
          <slot name="item" :entry="entry" />
        </template>
      </div>

      <div v-if="hasMore" class="entry-more">
        <AppButton variant="outline" :disabled="pending" @click="loadMore">
          {{ t('actions.loadMore') }}
        </AppButton>
      </div>
    </template>
  </div>
</template>

<style scoped>
.entry-feed {
  padding-block: var(--space-8) var(--space-12);
}

.entry-list {
  gap: var(--space-1);
}

.entry-grid .month-heading {
  grid-column: 1 / -1;
  /* A stretched grid item fills its row and can never stick. */
  align-self: start;
}

.entry-more {
  display: flex;
  justify-content: center;
  margin-top: var(--space-8);
}
</style>

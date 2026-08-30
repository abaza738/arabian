<script setup lang="ts">
const { block } = defineProps<{ block: CmsFlightSearchSection }>()

const { find } = useCms()

// The airport list comes from the timetable's own stations, because the CSV
// import creates one per ICAO it meets — so the dropdown can never offer a
// destination the schedule does not serve, and never miss one it does.
//
// Not localized and not falling back: an airport is reference data, the same
// row in every language. The key is shared with /flights so the two views make
// one request between them.
const { data: airports } = await useAsyncData(
  'airports',
  () =>
    find('Airports', {
      sort: 'icao:asc',
      pagination: { pageSize: 200 },
    })
      .then((response) => response.data)
      .catch(() => []),
  { default: () => [] },
)

// The whole schedule, under the key `/flights` uses, so the arrival field can
// offer only stations this origin actually reaches — and so following the form
// to /flights reuses the payload rather than fetching it again.
const { data: flights } = await useAsyncData(
  'timetable',
  () =>
    find('Flights', {
      populate: {
        departureAirport: { fields: ['icao'] },
        arrivalAirport: { fields: ['icao'] },
      },
      sort: ['flightNumber:asc', 'departUtc:asc'],
      pagination: { pageSize: 1000 },
    })
      .then((response) => response.data)
      .catch(() => []),
  { default: () => [] },
)
</script>

<template>
  <section class="inner flight-search-section">
    <AppSectionHeading
      v-if="block.title"
      :eyebrow="block.eyebrow ?? undefined"
      :title="block.title"
    />

    <p v-if="block.body" class="body">{{ block.body }}</p>

    <AppFlightSearchForm :airports="airports" :flights="flights" />
  </section>
</template>

<style scoped>
.flight-search-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-block: var(--space-10);
}

.body {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  max-width: 60ch;
}
</style>

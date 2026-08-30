<script setup lang="ts">
/**
 * The timetable, and the search over it.
 *
 * Deliberately not built on `AppEntryFeed`, which every other list route uses.
 * That component is fetch-then-paginate-then-month-heading and re-queries Strapi
 * whenever a filter changes; this page fetches the whole schedule once — a few
 * hundred rows, ~20 KB — and answers every subsequent search in the browser off
 * that one payload. There is no hook in `AppEntryFeed` for filtering after the
 * fetch, and adding one to serve a single caller would cost more than this page.
 *
 * With no `from`/`to` in the URL it renders the entire timetable, so the search
 * page and the published schedule are the same page.
 */
definePageMeta({
  name: 'flights',
})

const { t } = useI18n()
const route = useRoute()
const { find } = useCms()

// Airports and flights are reference data: not localized, so no `locale` and no
// `withLocaleFallback`. The `airports` key is shared with `BlockFlightSearch`,
// so arriving here from the home page's form reuses what it already fetched.
const { data: airports } = await useAsyncData(
  'airports',
  () =>
    find('Airports', { sort: 'icao:asc', pagination: { pageSize: 200 } })
      .then((response) => response.data)
      .catch(() => []),
  { default: () => [] },
)

const {
  data: flights,
  pending,
  error,
} = await useAsyncData(
  'timetable',
  () =>
    find('Flights', {
      // Only the ICAO is populated off each relation: the labels come from the
      // airport list above, so pulling the full airport onto all 600 legs would
      // multiply the payload for data the page already holds.
      populate: {
        departureAirport: { fields: ['icao'] },
        arrivalAirport: { fields: ['icao'] },
      },
      sort: ['flightNumber:asc', 'departUtc:asc'],
      pagination: { pageSize: 1000 },
    }).then((response) => response.data),
  { default: () => [] },
)

function param(key: string): string {
  const raw = route.query[key]
  return (Array.isArray(raw) ? raw[0] : raw) ?? ''
}

const from = computed(() => param('from').toUpperCase())
const to = computed(() => param('to').toUpperCase())
const date = computed(() => param('date'))
const trip = computed(() => param('trip'))
const returnDate = computed(() => param('return'))
const adults = computed(() => param('adults'))
const children = computed(() => param('children'))
const infants = computed(() => param('infants'))
const cabin = computed(() => param('cabin'))

const searching = computed(() => Boolean(from.value && to.value))

const options = computed(() => ({
  from: from.value,
  to: to.value,
  date: date.value || null,
}))

const outbound = computed(() =>
  searching.value
    ? [
        ...searchDirect(flights.value, options.value),
        ...searchOneStop(flights.value, options.value),
      ]
    : [],
)

const returning = computed(
  () => searching.value && trip.value === 'roundTrip' && !!returnDate.value,
)

const returnOptions = computed(() => ({
  from: to.value,
  to: from.value,
  date: returnDate.value,
}))

const inbound = computed(() =>
  returning.value
    ? [
        ...searchDirect(flights.value, returnOptions.value),
        ...searchOneStop(flights.value, returnOptions.value),
      ]
    : [],
)

const timetable = computed(() =>
  searching.value ? [] : flights.value.map((flight) => directItinerary(flight)),
)

const empty = computed(
  () => searching.value && !outbound.value.length && !inbound.value.length,
)

const airportsByIcao = computed(
  () => new Map(airports.value.map((airport) => [airport.icao, airport])),
)

usePageSeo(() => t('nav.flights'))
</script>

<template>
  <section class="inner flights-page">
    <AppSectionHeading
      :eyebrow="t('sections.theTimetable')"
      :title="t('nav.flights')"
    />

    <AppFlightSearchForm
      :airports="airports"
      :flights="flights"
      :from="from"
      :to="to"
      :date="date"
      :trip="trip"
      :return-date="returnDate"
      :adults="adults"
      :children="children"
      :infants="infants"
      :cabin="cabin"
    />

    <p v-if="error" class="state-message">{{ t('states.flightsFailed') }}</p>

    <p v-else-if="pending" class="state-message">{{ t('states.loading') }}</p>

    <p v-else-if="empty" class="state-message">
      {{ t('states.noItineraries', { from, to }) }}
    </p>

    <p v-else-if="!searching && !timetable.length" class="state-message">
      {{ t('states.noFlights') }}
    </p>

    <template v-else-if="searching">
      <section v-if="outbound.length" class="results">
        <h3 class="results-heading">{{ t('flight.outbound') }}</h3>
        <AppFlightRow
          v-for="itinerary in outbound"
          :key="itinerary.key"
          :itinerary="itinerary"
          :airports="airportsByIcao"
        />
      </section>

      <section v-if="inbound.length" class="results">
        <h3 class="results-heading">{{ t('flight.returnFlights') }}</h3>
        <AppFlightRow
          v-for="itinerary in inbound"
          :key="itinerary.key"
          :itinerary="itinerary"
          :airports="airportsByIcao"
        />
      </section>

      <p v-if="!date" class="note">{{ t('flight.pickDateForConnections') }}</p>
    </template>

    <section v-else class="results">
      <h3 class="results-heading">
        {{ t('flight.wholeTimetable', { count: timetable.length }) }}
      </h3>
      <AppFlightRow
        v-for="itinerary in timetable"
        :key="itinerary.key"
        :itinerary="itinerary"
        :airports="airportsByIcao"
      />
    </section>
  </section>
</template>

<style scoped>
.flights-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-block: var(--space-8);
}

.results {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.results-heading {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: var(--weight-normal);
  letter-spacing: var(--tracking-md);
  text-transform: uppercase;
  color: var(--color-text-tertiary);
}

.note {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}
</style>

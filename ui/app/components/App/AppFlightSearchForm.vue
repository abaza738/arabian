<script setup lang="ts">
const {
  airports,
  flights = [],
  from = '',
  to = '',
  date = '',
  trip = '',
  returnDate = '',
  adults = '',
  children = '',
  infants = '',
  cabin = '',
} = defineProps<{
  airports: CmsAirport[]
  flights?: CmsFlight[]
  from?: string
  to?: string
  date?: string
  trip?: string
  returnDate?: string
  adults?: string
  children?: string
  infants?: string
  cabin?: string
}>()

const { t } = useI18n()
const router = useRouter()
const { data: global } = useGlobal()

const cabins = computed(() => global.value?.cabinClasses ?? [])

// Frozen for the life of the page, and shared with every other instance of this
// form. A fresh `new Date()` on the client would disagree with the one the
// server rendered whenever a request straddles midnight UTC, and the date input
// would hydrate with a different `min` than it was sent with.
const today = useState('flights-today', () => todayUtc()).value

const selectedFrom = ref(from)
const selectedTo = ref(to)
const selectedDate = ref(date || today)
const selectedTrip = ref(trip === 'roundTrip' ? 'roundTrip' : 'oneWay')
const selectedReturn = ref(returnDate)
const selectedCabin = ref(cabin)

const pax = ref(readPassengers(adults, children, infants))

const arrivals = computed(() => {
  if (!selectedFrom.value || !flights.length) return airports
  const reachable = reachableIcaos(flights, selectedFrom.value)
  return airports.filter((airport) => reachable.has(airport.icao))
})

// The props are the URL, and the URL changes under a live form: submitting on
// /flights re-renders this component in place rather than remounting it.
watch(
  () => [from, to, date, trip, returnDate, adults, children, infants, cabin],
  ([nextFrom, nextTo, nextDate, nextTrip, nextReturn, , , , nextCabin]) => {
    selectedFrom.value = nextFrom ?? ''
    selectedTo.value = nextTo ?? ''
    selectedDate.value = nextDate || today
    selectedTrip.value = nextTrip === 'roundTrip' ? 'roundTrip' : 'oneWay'
    selectedReturn.value = nextReturn ?? ''
    selectedCabin.value = nextCabin ?? ''
    pax.value = readPassengers(adults, children, infants)
  },
)

const roundTrip = computed(() => selectedTrip.value === 'roundTrip')

watchEffect(() => {
  if (!selectedCabin.value && cabins.value.length) {
    selectedCabin.value = cabins.value[0]!.label
  }
})

function submit() {
  router.push({
    path: '/flights',
    query: {
      from: selectedFrom.value || undefined,
      to: selectedTo.value || undefined,
      date: selectedDate.value || undefined,
      trip: roundTrip.value ? 'roundTrip' : undefined,
      return: roundTrip.value ? selectedReturn.value || undefined : undefined,
      adults: pax.value.adults > 1 ? pax.value.adults : undefined,
      children: pax.value.children || undefined,
      infants: pax.value.infants || undefined,
      cabin: selectedCabin.value || undefined,
    },
  })
}
</script>

<template>
  <form class="flight-search" @submit.prevent="submit">
    <fieldset class="trip">
      <legend class="sr-only">{{ t('flight.tripType') }}</legend>
      <label
        v-for="option in ['oneWay', 'roundTrip']"
        :key="option"
        class="trip-option"
        :class="{ 'is-on': selectedTrip === option }"
      >
        <input
          v-model="selectedTrip"
          class="sr-only"
          type="radio"
          name="trip"
          :value="option"
        />
        {{ t(`flight.${option}`) }}
      </label>
    </fieldset>

    <AppAirportInput
      v-model="selectedFrom"
      class="field"
      :airports="airports"
      :exclude="selectedTo"
      :label="t('flight.from')"
      required
    />

    <AppAirportInput
      v-model="selectedTo"
      class="field"
      :airports="arrivals"
      :exclude="selectedFrom"
      :label="t('flight.to')"
      required
    />

    <label class="field field-date">
      <span class="field-label">{{
        roundTrip ? t('flight.departure') : t('flight.date')
      }}</span>
      <input
        v-model="selectedDate"
        type="date"
        :min="today"
        class="control"
        required
      />
    </label>

    <label v-if="roundTrip" class="field field-date">
      <span class="field-label">{{ t('flight.return') }}</span>
      <input
        v-model="selectedReturn"
        type="date"
        :min="selectedDate || today"
        class="control"
        required
      />
    </label>

    <AppPassengerCount v-model="pax" />

    <label v-if="cabins.length" class="field">
      <span class="field-label">{{ t('flight.cabin') }}</span>
      <select v-model="selectedCabin" class="control" required>
        <option
          v-for="option in cabins"
          :key="option.label"
          :value="option.label"
        >
          {{ option.label }}
        </option>
      </select>
    </label>

    <AppButton type="submit" variant="accent" size="md" class="submit">
      {{ t('flight.search') }}
    </AppButton>
  </form>
</template>

<style scoped>
.flight-search {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);
  align-items: end;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.trip {
  grid-column: 1 / -1;
  display: flex;
  gap: var(--space-1);
  border: 0;
  padding: 0;
  margin: 0;
}

.trip-option {
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-md);
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-3);
  cursor: pointer;
  transition: color var(--transition);
}

.trip-option.is-on {
  color: var(--color-text);
  background: var(--color-surface-subtle);
  border-color: var(--color-text-tertiary);
}

.trip-option:focus-within {
  border-color: var(--color-text);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.field-label {
  font-size: var(--text-3xs);
  letter-spacing: var(--tracking-md);
  text-transform: uppercase;
  color: var(--color-text-tertiary);
}

.control {
  width: 100%;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  transition: border-color var(--transition);
}

.control:hover {
  border-color: var(--color-text-tertiary);
}

.field-date .control {
  font-variant-numeric: tabular-nums;
}

.submit {
  grid-column: 1 / -1;
  justify-self: end;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .flight-search {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .flight-search {
    grid-template-columns: 1fr;
  }
  .submit {
    justify-self: stretch;
  }
}
</style>

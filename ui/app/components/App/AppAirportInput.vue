<script setup lang="ts">
const {
  airports,
  modelValue,
  label,
  exclude = '',
  required = false,
} = defineProps<{
  airports: CmsAirport[]
  modelValue: string
  label: string
  exclude?: string
  required?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const { t } = useI18n()

const LIMIT = 8

const listId = useId()
const inputId = useId()

const query = ref('')
const open = ref(false)
const active = ref(0)

const byIcao = computed(
  () => new Map(airports.map((airport) => [airport.icao, airport])),
)

const candidates = computed(() =>
  exclude ? airports.filter((airport) => airport.icao !== exclude) : airports,
)

function display(icao: string): string {
  const airport = byIcao.value.get(icao)
  if (!airport) return icao
  return `${airport.city || airport.name || airport.icao} (${airport.iata || airport.icao})`
}

function rank(airport: CmsAirport, needle: string): number {
  let best = 3
  for (const field of [
    airport.iata,
    airport.icao,
    airport.city,
    airport.name,
    airport.country,
  ]) {
    const value = field?.toLowerCase()
    if (!value) continue
    if (value === needle) return 0
    if (value.startsWith(needle)) best = Math.min(best, 1)
    else if (value.includes(needle)) best = Math.min(best, 2)
  }
  return best
}

const matches = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle || (modelValue && needle === display(modelValue).toLowerCase())) {
    return candidates.value.slice(0, LIMIT)
  }
  return candidates.value
    .map((airport) => ({ airport, score: rank(airport, needle) }))
    .filter((match) => match.score < 3)
    .sort(
      (a, b) =>
        a.score - b.score ||
        (a.airport.city ?? a.airport.icao).localeCompare(
          b.airport.city ?? b.airport.icao,
        ),
    )
    .slice(0, LIMIT)
    .map((match) => match.airport)
})

watchEffect(() => {
  query.value = modelValue ? display(modelValue) : ''
})

function meta(airport: CmsAirport): string {
  return [airport.name, airport.country, airport.icao]
    .filter(Boolean)
    .join(' · ')
}

function select(airport: CmsAirport) {
  emit('update:modelValue', airport.icao)
  query.value = display(airport.icao)
  open.value = false
}

function onInput() {
  open.value = true
  active.value = 0
  if (!query.value.trim() && modelValue) emit('update:modelValue', '')
}

function move(step: number) {
  open.value = true
  active.value = Math.min(
    Math.max(active.value + step, 0),
    matches.value.length - 1,
  )
}

function onEnter(event: KeyboardEvent) {
  const airport = open.value ? matches.value[active.value] : undefined
  if (airport) {
    event.preventDefault()
    select(airport)
    return
  }
  resolve()
}

function resolve() {
  open.value = false
  const text = query.value.trim()
  if (!text) {
    query.value = ''
    if (modelValue) emit('update:modelValue', '')
    return
  }
  if (text === display(modelValue)) return
  const needle = text.toLowerCase()
  const exact = candidates.value.find((airport) => rank(airport, needle) === 0)
  if (exact) select(exact)
  else emit('update:modelValue', text)
}

function close() {
  open.value = false
  query.value = modelValue ? display(modelValue) : ''
}
</script>

<template>
  <div class="airport-input">
    <label :for="inputId" class="field-label">{{ label }}</label>
    <input
      :id="inputId"
      v-model="query"
      class="control"
      type="text"
      role="combobox"
      :required="required"
      autocomplete="off"
      aria-autocomplete="list"
      :aria-controls="listId"
      :aria-expanded="open"
      :aria-activedescendant="
        open && matches[active] ? `${listId}-${active}` : undefined
      "
      :placeholder="t('flight.anyAirport')"
      @focus="open = true"
      @input="onInput"
      @blur="resolve"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter="onEnter"
      @keydown.esc="close"
    />

    <ul
      v-if="open && matches.length"
      :id="listId"
      class="options"
      role="listbox"
    >
      <li
        v-for="(airport, index) in matches"
        :id="`${listId}-${index}`"
        :key="airport.icao"
        class="option"
        :class="{ 'is-active': index === active }"
        role="option"
        :aria-selected="index === active"
        @mousedown.prevent="select(airport)"
        @mouseenter="active = index"
      >
        <span class="option-head">
          <span class="option-city">{{
            airport.city || airport.name || airport.icao
          }}</span>
          <span class="option-code">{{ airport.iata || airport.icao }}</span>
        </span>
        <span class="option-meta">{{ meta(airport) }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.airport-input {
  position: relative;
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

.options {
  position: absolute;
  top: 100%;
  inset-inline: 0;
  z-index: var(--z-sticky);
  margin-block-start: var(--space-1);
  list-style: none;
  padding: var(--space-1);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-nav);
}

.option {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.option.is-active {
  background: var(--color-surface-subtle);
}

.option-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
}

.option-city {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text);
}

.option-code {
  font-size: var(--text-3xs);
  letter-spacing: var(--tracking-md);
  color: var(--color-text-tertiary);
  font-variant-numeric: tabular-nums;
}

.option-meta {
  font-size: var(--text-3xs);
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

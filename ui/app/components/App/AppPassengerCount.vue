<script setup lang="ts">
const counts = defineModel<PassengerCounts>({ required: true })

const { t } = useI18n()

const route = useRoute()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

onClickOutside(root, () => {
  open.value = false
})

function step(kind: PassengerKind, delta: number) {
  const next = steppedPassengers(counts.value, kind, delta)
  if (next) counts.value = next
}

function allowed(kind: PassengerKind, delta: number): boolean {
  return steppedPassengers(counts.value, kind, delta) !== null
}

const summary = computed(() =>
  PASSENGER_KINDS.filter((kind) => counts.value[kind] > 0)
    .map((kind) => t(`flight.pax.${kind}Count`, counts.value[kind]))
    .join(' · '),
)

watch(
  () => route.fullPath,
  () => {
    open.value = false
  },
)
</script>

<template>
  <div ref="root" class="passenger-count" @keydown.esc="open = false">
    <span class="field-label">{{ t('flight.passengers') }}</span>

    <button
      type="button"
      class="control toggle"
      :aria-expanded="open"
      @click="open = !open"
    >
      {{ summary }}
    </button>

    <div v-if="open" class="panel">
      <div v-for="kind in PASSENGER_KINDS" :key="kind" class="row">
        <span class="labels">
          <span class="name">{{ t(`flight.pax.${kind}`) }}</span>
          <span class="age">{{ t(`flight.pax.${kind}Age`) }}</span>
        </span>
        <span class="stepper">
          <button
            type="button"
            class="step"
            :disabled="!allowed(kind, -1)"
            :aria-label="
              t('flight.pax.less', { kind: t(`flight.pax.${kind}`) })
            "
            @click="step(kind, -1)"
          >
            −
          </button>
          <span class="count">{{ counts[kind] }}</span>
          <button
            type="button"
            class="step"
            :disabled="!allowed(kind, 1)"
            :aria-label="
              t('flight.pax.more', { kind: t(`flight.pax.${kind}`) })
            "
            @click="step(kind, 1)"
          >
            +
          </button>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.passenger-count {
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

.toggle {
  text-align: start;
  cursor: pointer;
}

.panel {
  position: absolute;
  top: 100%;
  inset-inline: 0;
  z-index: var(--z-sticky);
  margin-block-start: var(--space-1);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: max-content;
  padding: var(--space-3);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-nav);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.labels {
  display: flex;
  flex-direction: column;
}

.name {
  font-size: var(--text-sm);
  color: var(--color-text);
}

.age {
  font-size: var(--text-2xs);
  color: var(--color-text-tertiary);
}

.stepper {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.step {
  width: var(--space-6);
  height: var(--space-6);
  font-size: var(--text-md);
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: border-color var(--transition);
}

.step:hover:not(:disabled) {
  border-color: var(--color-text-tertiary);
}

.step:disabled {
  color: var(--color-text-tertiary);
  opacity: 0.5;
  cursor: not-allowed;
}

.count {
  min-width: var(--space-5);
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
  text-align: center;
}
</style>

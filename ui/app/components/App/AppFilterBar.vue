<script setup lang="ts">
/**
 * One row of mutually exclusive filters over the feed below it: the categories
 * on /news, upcoming-or-past on /events.
 *
 * The state is the URL, not a ref — so a filtered feed is shareable, survives a
 * reload, and SSRs already filtered. That makes every option a plain link and
 * this component stateless: no click handler, no emit, no v-model. The browser
 * does the work, and Back means what a reader expects it to mean.
 */
const props = defineProps<{
  /** Query parameter this row writes, e.g. "category". */
  param: string
  /** `null` is the unfiltered option, and drops the parameter from the URL. */
  options: FilterOption[]
}>()

const route = useRoute()

const active = computed(() => {
  const raw = route.query[props.param]
  return (Array.isArray(raw) ? raw[0] : raw) ?? null
})

const to = (value: string | null) => ({
  query: { ...route.query, [props.param]: value ?? undefined },
})
</script>

<template>
  <div class="filter-bar mb-lg">
    <AppButton
      v-for="option in options"
      :key="option.value ?? 'all'"
      :to="to(option.value)"
      size="md"
      :variant="option.value === active ? 'dark' : 'outline'"
      :aria-current="option.value === active ? 'page' : undefined"
    >
      {{ option.label }}
    </AppButton>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.filter-bar > * {
  display: inline-flex;
  align-items: center;
  min-height: var(--space-11);
}
</style>

<script setup lang="ts">
const { event } = defineProps<{ event: CmsEvent }>()

const { t, locale } = useI18n()
const localePath = useLocalePath()

const start = computed(() => new Date(event.startsAt))
const day = computed(() =>
  new Intl.DateTimeFormat(locale.value, { day: 'numeric' }).format(start.value),
)
const month = computed(() =>
  new Intl.DateTimeFormat(locale.value, { month: 'short' }).format(start.value),
)
const time = computed(() =>
  new Intl.DateTimeFormat(locale.value, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(start.value),
)
</script>

<template>
  <NuxtLink
    :to="localePath({ name: 'event', params: { id: event.documentId } })"
    class="event-row"
    :class="{ featured: event.featured }"
  >
    <div class="event-date">
      <div class="event-day">{{ day }}</div>
      <div class="event-month">{{ month }}</div>
    </div>

    <div class="flex-1">
      <div class="event-name">
        {{ event.title }}
        <span
          v-if="
            event.eventStatus === 'postponed' ||
            event.eventStatus === 'cancelled'
          "
          class="event-flag"
          :class="event.eventStatus"
        >
          {{ t(`event.${event.eventStatus}`) }}
        </span>
      </div>
      <div class="event-meta">
        {{ time
        }}<template v-if="event.location?.name">
          &nbsp;·&nbsp;{{ event.location.name }}</template
        >
      </div>
    </div>

    <div v-if="event.featured" class="event-dot" />
  </NuxtLink>
</template>

<style scoped>
.event-row {
  display: flex;
  gap: var(--space-3-5);
  padding: var(--space-3) var(--space-4);
  border-radius: 10px;
  transition: background var(--transition);
  cursor: pointer;
  text-decoration: none;
  color: inherit;
}
.event-row:hover {
  background: var(--color-surface-subtle);
}
.event-row.featured {
  background: var(--color-accent-muted);
}
.event-row.featured:hover {
  background: var(--color-accent-hover);
}
.event-date {
  min-width: 42px;
  text-align: center;
  padding-top: var(--space-px);
}
.event-day {
  font-family: var(--font-serif);
  font-size: var(--text-xl);
  line-height: var(--leading-none);
  color: var(--color-text);
}
.event-month {
  font-size: var(--text-3xs);
  letter-spacing: var(--tracking-sm);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
}
.event-row > .flex-1 {
  min-width: 0;
}
.event-name {
  font-size: var(--text-md);
  font-weight: var(--weight-normal);
  color: var(--color-text);
  line-height: var(--leading-snug);
  overflow-wrap: break-word;
}
.event-meta {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  font-weight: var(--weight-light);
  margin-top: var(--space-0-5);
}
.event-flag {
  display: inline-block;
  margin-inline-start: var(--space-2);
  padding: 1px var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-3xs);
  letter-spacing: var(--tracking-sm);
  text-transform: uppercase;
  vertical-align: middle;
  white-space: nowrap;
}
.event-flag.postponed {
  background: var(--color-notice-warn-bg);
  color: var(--color-notice-warn-text);
}
.event-flag.cancelled {
  background: var(--color-notice-stop-bg);
  color: var(--color-notice-stop-text);
}
.event-dot {
  align-self: center;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-accent);
  opacity: 0.8;
  flex-shrink: 0;
}
</style>

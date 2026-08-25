<script setup lang="ts">
definePageMeta({
  name: 'event',
})

const route = useRoute()
const eventId = String(route.params.id ?? '')

if (!eventId) {
  throw createError({ statusCode: 404, statusMessage: 'No event ID' })
}

const { findOne } = useCms()
const { t } = useI18n()
const locale = useAppLocale()
const localePath = useLocalePath()

const { data, error } = await useAsyncData(
  () => `event-${eventId}-${locale.value}`,
  () =>
    withLocaleFallback(locale.value, (l) =>
      findOne('Events', eventId, {
        locale: l,
        populate: {
          cover: true,
          location: true,
          hub: true,
          seo: SEO_POPULATE,
          blocks: { populate: '*' },
        },
      }),
    ),
  { watch: [locale] },
)

const loaded = data.value?.data

if (error.value || !loaded) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Event not found',
    fatal: true,
  })
}

const event = computed(() => data.value?.data ?? loaded)

const start = computed(() => new Date(event.value.startsAt))
const end = computed(() =>
  event.value.endsAt ? new Date(event.value.endsAt) : null,
)

const hasEnded = computed(() => (end.value ?? start.value) < new Date())

const disruption = computed<'postponed' | 'cancelled' | null>(() =>
  event.value?.eventStatus === 'postponed' ||
  event.value?.eventStatus === 'cancelled'
    ? event.value.eventStatus
    : null,
)

const where = computed(() => locationLine(event.value?.location))

const parts = computed(() => ({
  weekday: new Intl.DateTimeFormat(locale.value, { weekday: 'long' }).format(
    start.value,
  ),
  day: new Intl.DateTimeFormat(locale.value, { day: 'numeric' }).format(
    start.value,
  ),
  monthYear: new Intl.DateTimeFormat(locale.value, {
    month: 'short',
    year: 'numeric',
  }).format(start.value),
}))

const time = (d: Date) =>
  new Intl.DateTimeFormat(locale.value, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(d)

const relative = computed(() => {
  const days = Math.round((start.value.getTime() - Date.now()) / 86_400_000)
  return new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' }).format(
    days,
    'day',
  )
})

function addToCalendar() {
  downloadIcs(event.value.slug ?? 'event', buildEventIcs(event.value))
}

const { shareImage } = useEntrySeo(() => event.value, {
  image: () => coverUrl(event.value, 'large'),
})

const schemaImage = shareImage()

const eventSchema = computed(() => {
  const place = event.value?.location

  return {
    name: event.value?.title,
    startDate: event.value?.startsAt,
    endDate: event.value?.endsAt ?? undefined,
    description: event.value?.description ?? undefined,
    location: place?.name
      ? {
          '@type': 'Place' as const,
          name: place.name,
          address:
            place.address || place.city
              ? {
                  '@type': 'PostalAddress' as const,
                  streetAddress: place.address ?? undefined,
                  addressLocality: place.city ?? undefined,
                }
              : place.name,
        }
      : undefined,
    eventStatus:
      disruption.value === 'cancelled'
        ? ('https://schema.org/EventCancelled' as const)
        : disruption.value === 'postponed'
          ? ('https://schema.org/EventPostponed' as const)
          : ('https://schema.org/EventScheduled' as const),
    image: schemaImage,
  }
})

useSchemaOrg([defineEvent(eventSchema)])
</script>

<template>
  <div v-if="event" class="inner flex-1 flex flex-col event-page">
    <NuxtLink :to="localePath({ name: 'events' })" class="back-link">
      <span class="back-arrow">←</span> {{ t('event.allEvents') }}
    </NuxtLink>

    <header class="event-masthead">
      <div class="date-plate">
        <div class="plate-weekday">{{ parts.weekday }}</div>
        <div class="plate-day">{{ parts.day }}</div>
        <div class="plate-month">{{ parts.monthYear }}</div>

        <div class="plate-rail">
          <time class="rail-time" :datetime="event.startsAt">
            {{ time(start) }}
          </time>
          <template v-if="end">
            <span class="rail-tick" aria-hidden="true" />
            <time
              class="rail-time rail-time-end"
              :datetime="event.endsAt ?? undefined"
            >
              {{ time(end) }}
            </time>
          </template>
        </div>
      </div>

      <div class="masthead-body">
        <div class="event-topline">
          <div class="event-status" :class="{ ended: hasEnded }">
            {{ relative }}
          </div>

          <NuxtLink
            v-if="event.hub?.slug"
            :to="
              localePath({
                name: 'hub',
                params: { slug: event.hub.slug },
              })
            "
            class="hub-chip"
          >
            <AppPill variant="grey">{{ event.hub.name }}</AppPill>
          </NuxtLink>
        </div>

        <p
          v-if="disruption"
          class="event-disruption"
          :class="disruption"
          role="status"
        >
          {{ t(`event.${disruption}Note`) }}
        </p>

        <h1 class="event-title">{{ event.title }}</h1>

        <p v-if="event.description" class="event-description">
          {{ event.description }}
        </p>

        <dl class="event-facts">
          <dt>{{ t('event.when') }}</dt>
          <dd>
            {{ formatDate(event.startsAt, locale) }} · {{ time(start)
            }}<template v-if="end">–{{ time(end) }}</template>
          </dd>

          <template v-if="where">
            <dt>{{ t('event.where') }}</dt>
            <dd>
              {{ where }}
              <a
                v-if="event.location?.mapUrl"
                :href="event.location.mapUrl"
                class="about-link map-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ t('event.viewMap') }} <span class="arrow">→</span>
              </a>
            </dd>
          </template>
        </dl>

        <div
          v-if="!hasEnded && disruption !== 'cancelled'"
          class="event-actions"
        >
          <AppButton
            v-if="event.registrationUrl"
            variant="accent"
            :href="event.registrationUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ t('event.register') }}
          </AppButton>

          <AppButton variant="dark" @click="addToCalendar">
            {{ t('event.addToCalendar') }}
          </AppButton>
        </div>
      </div>
    </header>

    <AppPhoto
      v-if="event.cover"
      :src="coverUrl(event, 'large')"
      :alt="event.cover?.alternativeText ?? ''"
      ratio="5 / 2"
      radius="var(--radius-lg)"
    />

    <BlockZone :blocks="event.blocks" />
  </div>
</template>

<style scoped>
.event-page {
  gap: var(--space-8);
  padding-block: var(--space-6) var(--space-10);
}

.back-link {
  align-self: flex-start;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  text-decoration: none;
  transition: color var(--transition);
}
.back-link:hover {
  color: var(--color-text);
}
.back-arrow {
  display: inline-block;
}

.event-masthead {
  display: grid;
  grid-template-columns: 148px 1fr;
  gap: var(--space-8);
  align-items: start;
}

.date-plate {
  position: sticky;
  top: calc(var(--nav-stack-height) + var(--space-6));
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-5) var(--space-3-5) var(--space-3-5);
  border-radius: var(--radius-md);
  background: var(--color-ink);
  color: var(--color-ink-on);
  box-shadow: var(--shadow-sm);
}

.plate-weekday {
  font-family: var(--font-sans);
  font-size: var(--text-2xs);
  font-weight: var(--weight-normal);
  letter-spacing: var(--tracking-lg);
  text-transform: uppercase;
  color: var(--color-ink-text-secondary);
}

.plate-day {
  font-family: var(--font-serif);
  font-size: var(--text-numeral);
  font-weight: var(--weight-medium);
  line-height: var(--leading-tight);
  letter-spacing: -2px;
}

.plate-month {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-lg);
  text-transform: uppercase;
  color: var(--color-ink-text);
}

.plate-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  width: 100%;
  margin-top: var(--space-3-5);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-ink-border);
}

.rail-time {
  font-family: var(--font-sans);
  font-size: var(--text-md);
  font-variant-numeric: tabular-nums;
  color: var(--color-ink-on);
}
.rail-time-end {
  color: var(--color-ink-text-secondary);
}

.rail-tick {
  width: 1px;
  height: 14px;
  background: var(--color-ink-text-muted);
}

.masthead-body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3-5);
}

.event-topline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.hub-chip {
  text-decoration: none;
}

.event-status {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  background: var(--color-pill-events-bg);
  color: var(--color-pill-events-text);
  font-family: var(--font-sans);
  font-size: var(--text-2xs);
  letter-spacing: var(--tracking-sm);
  text-transform: uppercase;
}
.event-status.ended {
  background: var(--color-surface-muted);
  color: var(--color-text-tertiary);
}

.event-disruption {
  width: 100%;
  padding: var(--space-2-5) var(--space-4);
  border-radius: var(--radius-sm);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--weight-normal);
}
.event-disruption.postponed {
  background: var(--color-notice-warn-bg);
  color: var(--color-notice-warn-text);
}
.event-disruption.cancelled {
  background: var(--color-notice-stop-bg);
  color: var(--color-notice-stop-text);
}

.map-link {
  margin-inline-start: var(--space-2);
  white-space: nowrap;
}

.event-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.event-title {
  font-family: var(--font-serif);
  font-size: var(--text-display-md);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-tight);
  letter-spacing: -0.3px;
}

.event-description {
  font-size: var(--text-lg);
  line-height: var(--leading-relaxed);
  color: var(--color-text-secondary);
}

.event-facts {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-1-5) var(--space-5);
  width: 100%;
  padding-block: var(--space-3-5);
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  font-family: var(--font-sans);
  font-size: var(--text-md);
}

.event-facts dt {
  font-size: var(--text-2xs);
  letter-spacing: var(--tracking-lg);
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  padding-top: var(--space-0-5);
}

.event-facts dd {
  color: var(--color-text);
}

@media (max-width: 720px) {
  .event-masthead {
    grid-template-columns: 1fr;
    gap: var(--space-5);
  }

  .date-plate {
    position: static;
    flex-direction: row;
    align-items: baseline;
    gap: var(--space-2-5);
    padding: var(--space-3) var(--space-4);
  }

  .plate-day {
    letter-spacing: -1px;
  }

  .plate-rail {
    flex-direction: row;
    align-items: baseline;
    justify-content: flex-end;
    gap: var(--space-2);
    width: auto;
    margin-inline-start: auto;
    padding: 0;
    padding-inline-start: var(--space-3-5);
    border-top: none;
    border-inline-start: 1px solid var(--color-ink-border);
  }

  .rail-tick {
    width: 10px;
    height: 1px;
  }
}
</style>

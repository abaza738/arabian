<script setup lang="ts">
const { itinerary, airports } = defineProps<{
  itinerary: Itinerary
  /** ICAO → airport, so a leg can name its endpoints without another lookup. */
  airports: Map<string, CmsAirport>
}>()

const { t, locale } = useI18n()

const dateFormat = computed(
  () =>
    new Intl.DateTimeFormat(locale.value, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    }),
)

function dateLabel(date: string | null) {
  return date ? dateFormat.value.format(new Date(`${date}T00:00:00Z`)) : ''
}

function placeOf(icao: string) {
  const airport = airports.get(icao)
  return airport?.city || airport?.name || ''
}
</script>

<template>
  <article class="itinerary">
    <template
      v-for="(leg, index) in itinerary.legs"
      :key="leg.flight.documentId"
    >
      <div v-if="index > 0" class="layover">
        {{
          t('flight.changeAt', {
            airport: itinerary.viaIcao,
            duration: formatDuration(itinerary.layoverMinutes ?? 0),
          })
        }}
      </div>

      <div class="leg">
        <div class="identity">
          <span class="number">{{ leg.flight.flightNumber }}</span>
          <span class="callsign">{{ leg.flight.callsign }}</span>
        </div>

        <div class="endpoint">
          <time class="clock"
            >{{ formatUtc(leg.flight.departUtc)
            }}<span class="zulu">Z</span></time
          >
          <span class="icao">{{ departureIcao(leg.flight) }}</span>
          <span class="place">{{ placeOf(departureIcao(leg.flight)) }}</span>
          <span v-if="leg.departDate" class="on">{{
            dateLabel(leg.departDate)
          }}</span>
        </div>

        <div class="span">
          <span class="block-time">{{
            formatDuration(blockMinutes(leg.flight))
          }}</span>
          <span class="rule" aria-hidden="true" />
        </div>

        <div class="endpoint">
          <time class="clock">
            {{ formatUtc(leg.flight.arriveUtc) }}<span class="zulu">Z</span>
            <sup v-if="arrivesNextDay(leg.flight)" class="next-day">{{
              t('flight.plusOneDay')
            }}</sup>
          </time>
          <span class="icao">{{ arrivalIcao(leg.flight) }}</span>
          <span class="place">{{ placeOf(arrivalIcao(leg.flight)) }}</span>
          <span v-if="leg.arriveDate" class="on">{{
            dateLabel(leg.arriveDate)
          }}</span>
        </div>

        <div class="meta">
          <span v-if="!leg.departDate" class="days">
            <span
              v-for="day in parseDays(leg.flight.days)"
              :key="day"
              class="day"
            >
              {{ t(`flight.days.${day}`) }}
            </span>
          </span>
          <span v-if="leg.flight.tags" class="tags">{{ leg.flight.tags }}</span>
        </div>
      </div>
    </template>

    <p v-if="itinerary.legs.length > 1" class="total">
      {{
        t('flight.totalTime', {
          duration: formatDuration(itinerary.totalMinutes),
        })
      }}
    </p>
  </article>
</template>

<style scoped>
.itinerary {
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.leg {
  display: grid;
  grid-template-columns:
    minmax(0, 7rem) minmax(0, 1fr) minmax(0, 7rem) minmax(0, 1fr)
    minmax(0, 9rem);
  gap: var(--space-4);
  align-items: center;
}

.identity {
  display: flex;
  flex-direction: column;
}

.number {
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  color: var(--color-text);
}

.callsign {
  font-size: var(--text-2xs);
  letter-spacing: var(--tracking-md);
  text-transform: uppercase;
  color: var(--color-text-tertiary);
}

.endpoint {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.clock {
  font-size: var(--text-xl);
  font-variant-numeric: tabular-nums;
  color: var(--color-text);
  line-height: var(--leading-tight);
}

.zulu {
  font-size: var(--text-2xs);
  color: var(--color-text-tertiary);
  margin-left: var(--space-px);
}

.next-day {
  font-size: var(--text-2xs);
  color: var(--color-accent);
  margin-left: var(--space-1);
}

.icao {
  font-size: var(--text-sm);
  letter-spacing: var(--tracking-md);
  color: var(--color-text-secondary);
}

.place,
.on {
  font-size: var(--text-2xs);
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.span {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
}

.block-time {
  font-size: var(--text-2xs);
  color: var(--color-text-tertiary);
  font-variant-numeric: tabular-nums;
}

.rule {
  width: 100%;
  height: 1px;
  background: var(--color-border);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  justify-content: flex-end;
}

.days {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-px);
}

.day {
  font-size: var(--text-3xs);
  letter-spacing: var(--tracking-sm);
  text-transform: uppercase;
  color: var(--color-text-secondary);
  background: var(--color-surface-subtle);
  border-radius: var(--radius-sm);
  padding: var(--space-px) var(--space-1);
}

.tags {
  font-size: var(--text-2xs);
  color: var(--color-text-tertiary);
  letter-spacing: var(--tracking-sm);
}

.layover {
  font-size: var(--text-2xs);
  letter-spacing: var(--tracking-md);
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  padding-block: var(--space-2);
}

.total {
  font-size: var(--text-2xs);
  color: var(--color-text-secondary);
  text-align: right;
}

@media (max-width: 900px) {
  .leg {
    grid-template-columns: 1fr 1fr;
    gap: var(--space-2);
    align-items: start;
  }
  .identity,
  .meta {
    grid-column: 1 / -1;
  }
  .meta {
    justify-content: flex-start;
  }
  .span {
    display: none;
  }
}
</style>

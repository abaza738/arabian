/**
 * Searching the timetable, as plain functions over plain data.
 *
 * The whole schedule is a few hundred rows, so it is fetched once and searched
 * in the browser rather than filtered by Strapi — see `app/pages/flights.vue`.
 * Nothing in here fetches, and nothing in here touches a component.
 *
 * Two rules underpin all of it:
 *
 * - **Every time is Zulu.** There is no timezone per airport and no DST, so two
 *   times can be compared as minutes-since-midnight with no conversion.
 * - **`days` names the days a flight *departs*.** An `arriveUtc` earlier than
 *   its `departUtc` therefore means it lands the following day, which is the
 *   only sense in which a date is ever advanced.
 *
 * Auto-imported: Nuxt exposes `shared/utils` to the app and to Nitro.
 */

/** Shortest connection that counts as makeable. */
export const MIN_LAYOVER_MINUTES = 45

/** Longest wait still presented as one itinerary rather than two trips. */
export const MAX_LAYOVER_MINUTES = 360

const MINUTES_PER_DAY = 1440

/**
 * `"22:45:00.000"` — Strapi widens a `time` attribute past the `HH:MM` the
 * schedule CSV holds, so only the first two fields are read.
 */
export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':')
  return Number(hours) * 60 + Number(minutes)
}

export function formatUtc(time: string): string {
  return time.slice(0, 5)
}

/** `"136"` → `[1, 3, 6]`. */
export function parseDays(days: string): number[] {
  return [...days].map(Number).filter((day) => day >= 1 && day <= 7)
}

export function operatesOn(flight: CmsFlight, isoDay: number): boolean {
  return flight.days.includes(String(isoDay))
}

/** Wheels-up to wheels-down, in minutes, across midnight if it has to. */
export function blockMinutes(flight: CmsFlight): number {
  const depart = toMinutes(flight.departUtc)
  const arrive = toMinutes(flight.arriveUtc)
  return (arrive - depart + MINUTES_PER_DAY) % MINUTES_PER_DAY
}

export function arrivesNextDay(flight: CmsFlight): boolean {
  return toMinutes(flight.arriveUtc) < toMinutes(flight.departUtc)
}

export function departureIcao(flight: CmsFlight): string {
  return flight.departureAirport?.icao ?? ''
}

export function arrivalIcao(flight: CmsFlight): string {
  return flight.arrivalAirport?.icao ?? ''
}

/**
 * ISO weekday of a `YYYY-MM-DD` date: 1 is Monday, 7 is Sunday.
 *
 * Parsed as UTC rather than local — `new Date('2026-09-03')` is already UTC
 * midnight, but reading it back with `getDay()` would shift it by the viewer's
 * offset and hand back the wrong weekday for anyone west of Greenwich.
 */
export function isoDayOf(date: string): number {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay()
  return day === 0 ? 7 : day
}

export function addDays(date: string, count: number): string {
  const shifted = new Date(`${date}T00:00:00Z`)
  shifted.setUTCDate(shifted.getUTCDate() + count)
  return shifted.toISOString().slice(0, 10)
}

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

export interface ItineraryLeg {
  flight: CmsFlight
  /** `null` when the search named no date, so the feed is every operating day. */
  departDate: string | null
  arriveDate: string | null
}

export interface Itinerary {
  /** Stable across a re-search, so it can key a `v-for`. */
  key: string
  legs: ItineraryLeg[]
  departDate: string | null
  arriveDate: string | null
  /** Gate to gate including any wait, in minutes. */
  totalMinutes: number
  layoverMinutes?: number
  viaIcao?: string
}

function legOf(flight: CmsFlight, departDate: string | null): ItineraryLeg {
  return {
    flight,
    departDate,
    arriveDate:
      departDate && arrivesNextDay(flight)
        ? addDays(departDate, 1)
        : departDate,
  }
}

/** One flight on its own, which is both a direct result and a timetable row. */
export function directItinerary(
  flight: CmsFlight,
  date: string | null = null,
): Itinerary {
  const leg = legOf(flight, date)
  return {
    key: flight.documentId,
    legs: [leg],
    departDate: leg.departDate,
    arriveDate: leg.arriveDate,
    totalMinutes: blockMinutes(flight),
  }
}

function byDeparture(a: Itinerary, b: Itinerary): number {
  const first = a.legs[0]!
  const second = b.legs[0]!
  return (
    toMinutes(first.flight.departUtc) - toMinutes(second.flight.departUtc) ||
    a.totalMinutes - b.totalMinutes
  )
}

function departuresByIcao(flights: CmsFlight[]): Map<string, CmsFlight[]> {
  const index = new Map<string, CmsFlight[]>()
  for (const flight of flights) {
    const icao = departureIcao(flight)
    if (!icao) continue
    const existing = index.get(icao)
    if (existing) existing.push(flight)
    else index.set(icao, [flight])
  }
  return index
}

export interface SearchOptions {
  from: string
  to: string
  /** `YYYY-MM-DD`. Omitted means every operating day, and no connections. */
  date?: string | null
}

/** Non-stop services, sorted by departure. */
/**
 * Every station reachable from `from` in one or two legs, ignoring dates and
 * connection times: what the arrival field may offer, not what a given day
 * actually flies. A pair that survives here can still come back empty from
 * `searchOneStop`, which is what the empty state is for.
 */
export function reachableIcaos(
  flights: CmsFlight[],
  from: string,
): Set<string> {
  const departures = departuresByIcao(flights)
  const reached = new Set<string>()

  for (const first of departures.get(from) ?? []) {
    const via = arrivalIcao(first)
    if (!via || via === from) continue
    reached.add(via)

    for (const second of departures.get(via) ?? []) {
      const end = arrivalIcao(second)
      if (end && end !== from) reached.add(end)
    }
  }

  return reached
}

export function searchDirect(
  flights: CmsFlight[],
  { from, to, date }: SearchOptions,
): Itinerary[] {
  const isoDay = date ? isoDayOf(date) : null

  return flights
    .filter(
      (flight) =>
        departureIcao(flight) === from &&
        arrivalIcao(flight) === to &&
        (isoDay === null || operatesOn(flight, isoDay)),
    )
    .map((flight) => directItinerary(flight, date ?? null))
    .sort(byDeparture)
}

/**
 * One-stop itineraries, sorted by departure.
 *
 * A date is required, and not for convenience: the second leg has to operate on
 * the day it would actually leave, which is the day the first leg *lands* — one
 * later than the search date whenever the first leg is overnight. Without a date
 * there is no weekday to check the second leg against, and every result would be
 * a guess. Direct search has no such problem and still answers dateless.
 */
export function searchOneStop(
  flights: CmsFlight[],
  { from, to, date }: SearchOptions,
): Itinerary[] {
  if (!date) return []

  const isoDay = isoDayOf(date)
  const departures = departuresByIcao(flights)
  const itineraries: Itinerary[] = []

  for (const first of departures.get(from) ?? []) {
    const via = arrivalIcao(first)
    if (!via || via === to || via === from) continue
    if (!operatesOn(first, isoDay)) continue

    const firstLeg = legOf(first, date)
    const arriveDate = firstLeg.arriveDate as string
    const arriveMinutes = toMinutes(first.arriveUtc)

    for (const second of departures.get(via) ?? []) {
      if (arrivalIcao(second) !== to) continue

      const departMinutes = toMinutes(second.departUtc)
      const layoverMinutes =
        (departMinutes - arriveMinutes + MINUTES_PER_DAY) % MINUTES_PER_DAY

      if (
        layoverMinutes < MIN_LAYOVER_MINUTES ||
        layoverMinutes > MAX_LAYOVER_MINUTES
      ) {
        continue
      }

      // A wait that crosses midnight pushes the onward leg into the next day,
      // so it is that day's schedule it has to appear in.
      const secondDepartDate =
        departMinutes < arriveMinutes ? addDays(arriveDate, 1) : arriveDate
      if (!operatesOn(second, isoDayOf(secondDepartDate))) continue

      const secondLeg = legOf(second, secondDepartDate)

      itineraries.push({
        key: `${first.documentId}-${second.documentId}`,
        legs: [firstLeg, secondLeg],
        departDate: firstLeg.departDate,
        arriveDate: secondLeg.arriveDate,
        totalMinutes:
          blockMinutes(first) + layoverMinutes + blockMinutes(second),
        layoverMinutes,
        viaIcao: via,
      })
    }
  }

  return itineraries.sort(byDeparture)
}

/** `"1h 25m"`, or `"45m"` under the hour. */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours ? `${hours}h ${String(rest).padStart(2, '0')}m` : `${rest}m`
}

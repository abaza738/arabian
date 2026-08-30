export const PASSENGER_KINDS = ['adults', 'children', 'infants'] as const

export type PassengerKind = (typeof PASSENGER_KINDS)[number]

export type PassengerCounts = Record<PassengerKind, number>

export const MAX_SEATS = 9

export function sanitizePassengers(counts: PassengerCounts): PassengerCounts {
  const adults = Math.min(
    Math.max(Math.trunc(counts.adults) || 1, 1),
    MAX_SEATS,
  )
  const children = Math.min(
    Math.max(Math.trunc(counts.children) || 0, 0),
    MAX_SEATS - adults,
  )
  const infants = Math.min(Math.max(Math.trunc(counts.infants) || 0, 0), adults)
  return { adults, children, infants }
}

export function readPassengers(
  adults: string,
  children: string,
  infants: string,
): PassengerCounts {
  return sanitizePassengers({
    adults: Number(adults),
    children: Number(children),
    infants: Number(infants),
  })
}

export function steppedPassengers(
  counts: PassengerCounts,
  kind: PassengerKind,
  delta: number,
): PassengerCounts | null {
  const next = { ...counts, [kind]: counts[kind] + delta }
  const clean = sanitizePassengers(next)
  return PASSENGER_KINDS.every((key) => clean[key] === next[key]) ? clean : null
}

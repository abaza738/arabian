import fs from 'fs-extra'
import path from 'path'

const WEEKDAY_NUMBERS: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
}

const COLUMNS = {
  flightNumber: 'Flight Number',
  callsign: 'Callsign',
  origin: 'Origin',
  destination: 'Destination',
  departUtc: 'Departure Time (HH:MM)',
  arriveUtc: 'Arrival Time (HH:MM)',
  days: 'Service Days',
  tags: 'Tags',
  hidden: 'Is Hidden',
  deleted: '_delete',
}

const REQUIRED_COLUMNS = [
  COLUMNS.flightNumber,
  COLUMNS.callsign,
  COLUMNS.origin,
  COLUMNS.destination,
  COLUMNS.departUtc,
  COLUMNS.arriveUtc,
  COLUMNS.days,
]

const ICAO = /^[A-Z]{3,4}$/
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

let importing = false

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (quoted) {
      if (char !== '"') {
        field += char
      } else if (text[i + 1] === '"') {
        field += '"'
        i++
      } else {
        quoted = false
      }
      continue
    }

    if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (char !== '\r') {
      field += char
    }
  }

  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ''))
}

function isTruthy(value: string): boolean {
  const normalised = value.trim().toLowerCase()
  return normalised === 'true' || normalised === '1' || normalised === 'yes'
}

function normaliseDays(raw: string): { days?: string; error?: string } {
  const names = raw
    .split(',')
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean)

  if (!names.length) return { error: `${COLUMNS.days} is empty` }

  const numbers: number[] = []
  for (const name of names) {
    const number = WEEKDAY_NUMBERS[name]
    if (!number) return { error: `unknown service day "${name}"` }
    if (numbers.includes(number)) {
      return { error: `duplicate service day "${name}"` }
    }
    numbers.push(number)
  }

  return { days: numbers.sort((a, b) => a - b).join('') }
}

interface ParsedFlight {
  flightNumber: string
  callsign: string
  origin: string
  destination: string
  departUtc: string
  arriveUtc: string
  days: string
  tags: string
}

interface ParseResult {
  flights: ParsedFlight[]
  errors: string[]
  skipped: number
}

function readRows(text: string): ParseResult {
  const rows = parseCsv(text)
  if (!rows.length) {
    return { flights: [], errors: ['the file is empty'], skipped: 0 }
  }

  const header = rows[0].map((cell) => cell.trim())
  const missing = REQUIRED_COLUMNS.filter((name) => !header.includes(name))
  if (missing.length) {
    return {
      flights: [],
      errors: [`missing required column(s): ${missing.join(', ')}`],
      skipped: 0,
    }
  }

  const at = (cells: string[], column: string) => {
    const index = header.indexOf(column)
    return index === -1 ? '' : (cells[index] ?? '').trim()
  }

  const flights: ParsedFlight[] = []
  const errors: string[] = []
  let skipped = 0

  rows.slice(1).forEach((cells, offset) => {
    const line = offset + 2

    if (
      isTruthy(at(cells, COLUMNS.hidden)) ||
      isTruthy(at(cells, COLUMNS.deleted))
    ) {
      skipped++
      return
    }

    const flightNumber = at(cells, COLUMNS.flightNumber)
    const callsign = at(cells, COLUMNS.callsign)
    const origin = at(cells, COLUMNS.origin).toUpperCase()
    const destination = at(cells, COLUMNS.destination).toUpperCase()
    const departUtc = at(cells, COLUMNS.departUtc)
    const arriveUtc = at(cells, COLUMNS.arriveUtc)
    const { days, error: daysError } = normaliseDays(at(cells, COLUMNS.days))

    const problems: string[] = []
    if (!flightNumber) problems.push(`${COLUMNS.flightNumber} is empty`)
    if (!callsign) problems.push(`${COLUMNS.callsign} is empty`)
    if (!ICAO.test(origin)) {
      problems.push(`${COLUMNS.origin} "${origin}" is not an ICAO code`)
    }
    if (!ICAO.test(destination)) {
      problems.push(
        `${COLUMNS.destination} "${destination}" is not an ICAO code`,
      )
    }
    if (origin && origin === destination) {
      problems.push(
        `${COLUMNS.origin} and ${COLUMNS.destination} are the same airport`,
      )
    }
    if (!HHMM.test(departUtc)) {
      problems.push(`${COLUMNS.departUtc} "${departUtc}" is not HH:MM`)
    }
    if (!HHMM.test(arriveUtc)) {
      problems.push(`${COLUMNS.arriveUtc} "${arriveUtc}" is not HH:MM`)
    }
    if (daysError) problems.push(daysError)

    if (problems.length) {
      errors.push(`line ${line}: ${problems.join('; ')}`)
      return
    }

    flights.push({
      flightNumber,
      callsign,
      origin,
      destination,
      departUtc: `${departUtc}:00.000`,
      arriveUtc: `${arriveUtc}:00.000`,
      days: days as string,
      tags: at(cells, COLUMNS.tags),
    })
  })

  return { flights, errors, skipped }
}

async function resolveAirports(icaos: string[]) {
  const existing = await strapi.db.query('api::airport.airport').findMany({})
  const byIcao = new Map<string, string>(
    existing.map((airport) => [airport.icao, airport.documentId]),
  )
  const created: string[] = []

  for (const icao of icaos) {
    if (byIcao.has(icao)) continue
    const airport = await strapi
      .documents('api::airport.airport')
      .create({ data: { icao } })
    byIcao.set(icao, airport.documentId)
    created.push(icao)
  }

  return { byIcao, created }
}

async function saveReport(documentId: string, report: string) {
  await strapi.documents('api::timetable.timetable').update({
    documentId,
    data: {
      lastImportReport: report,
      lastImportedAt: new Date().toISOString(),
    },
  })
}

async function runImport() {
  const timetable = await strapi
    .documents('api::timetable.timetable')
    .findFirst({ populate: ['csv'] })

  if (!timetable) return

  const url = (timetable.csv as { url?: string } | null)?.url
  if (!url) {
    await saveReport(timetable.documentId, 'No CSV uploaded.')
    return
  }

  const file = path.join(strapi.dirs.static.public, url.replace(/^\//, ''))
  if (!(await fs.pathExists(file))) {
    await saveReport(
      timetable.documentId,
      `Could not read the uploaded file at ${url}.`,
    )
    return
  }

  const { flights, errors, skipped } = readRows(await fs.readFile(file, 'utf8'))

  if (errors.length) {
    await saveReport(
      timetable.documentId,
      `Import aborted, nothing changed. ${errors.length} problem(s):\n${errors.join('\n')}`,
    )
    return
  }

  const icaos = [
    ...new Set(
      flights.flatMap((flight) => [flight.origin, flight.destination]),
    ),
  ].sort()
  const { byIcao, created } = await resolveAirports(icaos)

  await strapi.db.query('api::flight.flight').deleteMany({})

  for (const flight of flights) {
    await strapi.documents('api::flight.flight').create({
      data: {
        flightNumber: flight.flightNumber,
        callsign: flight.callsign,
        departureAirport: byIcao.get(flight.origin),
        arrivalAirport: byIcao.get(flight.destination),
        departUtc: flight.departUtc,
        arriveUtc: flight.arriveUtc,
        days: flight.days,
        tags: flight.tags || null,
      },
    })
  }

  const report = [`Imported ${flights.length} flights.`]
  if (skipped)
    report.push(`Skipped ${skipped} row(s) marked hidden or deleted.`)
  report.push(
    created.length
      ? `Created ${created.length} airport(s): ${created.join(', ')}. Fill in their names and cities.`
      : 'No new airports.',
  )

  await saveReport(timetable.documentId, report.join(' '))
}

function scheduleImport() {
  if (importing) return
  importing = true
  setImmediate(() => {
    runImport()
      .catch((error) => strapi.log.error(`Timetable import failed: ${error}`))
      .finally(() => {
        importing = false
      })
  })
}

export default {
  afterCreate: scheduleImport,
  afterUpdate: scheduleImport,
}

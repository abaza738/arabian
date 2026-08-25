/**
 * Builds an .ics file for a single event. Every calendar app on every platform
 * imports this format, which is why it beats per-vendor "add to Google/Outlook"
 * links — one button, no vendor list.
 */

// RFC 5545 §3.3.11: backslash, semicolon and comma are escaped, newlines become
// a literal \n. Skipping this is what turns a description with a comma into a
// truncated field.
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

function toUtcStamp(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
}

// RFC 5545 §3.1: no content line exceeds 75 octets. Longer ones are split and
// continued with a leading space — a long DESCRIPTION is otherwise rejected or
// truncated by strict parsers. Octets, not characters: non-ASCII text is
// multi-byte, so a 75-*character* split would still be over budget.
function foldLine(line: string): string {
  const encoder = new TextEncoder()
  if (encoder.encode(line).length <= 75) return line

  const out: string[] = []
  let chunk = ''
  let bytes = 0
  // Iterating the string (not the byte array) keeps code points whole; a split
  // through the middle of one produces mojibake.
  for (const char of line) {
    const size = encoder.encode(char).length
    // 74 on continuation lines: the leading space counts toward the 75.
    if (bytes + size > (out.length ? 74 : 75)) {
      out.push(chunk)
      chunk = ''
      bytes = 0
    }
    chunk += char
    bytes += size
  }
  out.push(chunk)

  return out.join('\r\n ')
}

export function buildEventIcs(event: CmsEvent): string {
  const start = new Date(event.startsAt)
  // ponytail: an event with no end time is treated as two hours. Set `endsAt` in
  // the CMS for anything where the real duration matters.
  const end = event.endsAt
    ? new Date(event.endsAt)
    : new Date(start.getTime() + 2 * 60 * 60 * 1000)

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//arabian//events//EN',
    'BEGIN:VEVENT',
    `UID:${event.documentId}@arabian`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(start)}`,
    `DTEND:${toUtcStamp(end)}`,
    `SUMMARY:${escapeText(event.title)}`,
  ]

  // The full line, not just the venue name: a calendar entry is read away from
  // the site, so the address has to travel with it.
  const location = locationLine(event.location)
  if (location) lines.push(`LOCATION:${escapeText(location)}`)
  if (event.description)
    lines.push(`DESCRIPTION:${escapeText(event.description)}`)

  lines.push('END:VEVENT', 'END:VCALENDAR')

  return lines.map(foldLine).join('\r\n')
}

export function downloadIcs(filename: string, ics: string) {
  const url = URL.createObjectURL(
    new Blob([ics], { type: 'text/calendar;charset=utf-8' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.ics`
  // In the DOM before clicking, and revoked a tick later: Firefox ignores
  // clicks on a detached anchor, and revoking synchronously can cancel the
  // download before the browser has read the blob.
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  setTimeout(() => {
    link.remove()
    URL.revokeObjectURL(url)
  }, 0)
}

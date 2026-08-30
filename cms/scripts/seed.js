'use strict'

const fs = require('fs-extra')
const path = require('path')
const mime = require('mime-types')
const data = require('../data/data.json')

// A fork that strips a section out of data.json should seed less, not crash on
// `Object.entries(undefined)` — the translation maps in particular are the
// first thing a new site deletes.
const categories = data.categories ?? []
const categoryTranslations = data.categoryTranslations ?? {}
const ranks = data.ranks ?? []
const rankTranslations = data.rankTranslations ?? {}
const pilots = data.pilots ?? []
const pilotTranslations = data.pilotTranslations ?? {}
const articles = data.articles ?? []
const articleTranslations = data.articleTranslations ?? {}
const events = data.events ?? []
const eventTranslations = data.eventTranslations ?? {}
const announcements = data.announcements ?? []
const announcementTranslations = data.announcementTranslations ?? {}
const fleet = data.fleet ?? []
const fleetTranslations = data.fleetTranslations ?? {}
const destinations = data.destinations ?? []
const destinationTranslations = data.destinationTranslations ?? {}
const documents = data.documents ?? []
const documentTranslations = data.documentTranslations ?? {}
const globalTranslations = data.globalTranslations ?? {}
const hubs = data.hubs ?? []
const hubTranslations = data.hubTranslations ?? {}
const pages = data.pages ?? []
const pageTranslations = data.pageTranslations ?? {}
const aboutTranslations = data.aboutTranslations ?? {}
const homeTranslations = data.homeTranslations ?? {}
const { global, about, home } = data

// Locales this site ships with beyond `en`, which is Strapi's default and
// already exists, so it is never listed here. The site is English-only, so this
// is empty and every `*Translations` map above goes unread. Adding a language
// means an entry here, a matching one in `ui/shared/utils/locales.ts`, and the
// translation maps in data.json.
const LOCALES = []

async function seedExampleApp() {
  const shouldImportSeedData = await isFirstRun()

  if (shouldImportSeedData) {
    try {
      console.log('Setting up the template...')
      await importSeedData()
      console.log('Ready to go')
    } catch (error) {
      console.log('Could not import seed data')
      console.error(error)
    }
  } else {
    console.log(
      'Seed data has already been imported. We cannot reimport unless you clear your database first.',
    )
  }
}

async function isFirstRun() {
  const pluginStore = strapi.store({
    environment: strapi.config.environment,
    type: 'type',
    name: 'setup',
  })
  const initHasRun = await pluginStore.get({ key: 'initHasRun' })
  await pluginStore.set({ key: 'initHasRun', value: true })
  return !initHasRun
}

async function setPublicPermissions(newPermissions) {
  // Find the ID of the public role
  const publicRole = await strapi
    .query('plugin::users-permissions.role')
    .findOne({
      where: {
        type: 'public',
      },
    })

  // Create the new permissions and link them to the public role
  const allPermissionsToCreate = []
  Object.keys(newPermissions).map((controller) => {
    const actions = newPermissions[controller]
    const permissionsToCreate = actions.map((action) => {
      return strapi.query('plugin::users-permissions.permission').create({
        data: {
          action: `api::${controller}.${controller}.${action}`,
          role: publicRole.id,
        },
      })
    })
    allPermissionsToCreate.push(...permissionsToCreate)
  })
  await Promise.all(allPermissionsToCreate)
}

function getFileSizeInBytes(filePath) {
  const stats = fs.statSync(filePath)
  const fileSizeInBytes = stats['size']
  return fileSizeInBytes
}

function getFileData(fileName) {
  const filePath = path.join('data', 'uploads', fileName)
  // Parse the file metadata
  const size = getFileSizeInBytes(filePath)
  const ext = fileName.split('.').pop()
  const mimeType = mime.lookup(ext || '') || ''

  return {
    filepath: filePath,
    originalFileName: fileName,
    size,
    mimetype: mimeType,
  }
}

// Seed media is optional. data.json names the photographs a fork is expected to
// drop into data/uploads, but a name with no file behind it is not an error:
// every image slot in the UI has a designed placeholder — AppPhoto's, SiteNav's
// logo circle, the About page's initial-letter avatar, the generated OG card —
// so the seed skips it and the page falls back. Without this, `fs.statSync` in
// getFileData throws and takes the whole run down over a missing photograph.
function fileExists(fileName) {
  return fs.existsSync(path.join('data', 'uploads', fileName))
}

// One media field. Null for unset or absent, which every `media` attribute in
// the schema accepts.
async function media(fileName) {
  if (!fileName || !fileExists(fileName)) return null
  return checkFileExistsBeforeUpload([fileName])
}

async function uploadFile(file, name) {
  return strapi
    .plugin('upload')
    .service('upload')
    .upload({
      files: file,
      data: {
        fileInfo: {
          alternativeText: `An image uploaded to Strapi called ${name}`,
          caption: name,
          name,
        },
      },
    })
}

// Create an entry and attach files if there are any
async function createEntry({ model, entry, locale, status }) {
  try {
    // Actually create the entry in Strapi
    return await strapi.documents(`api::${model}.${model}`).create({
      data: entry,
      ...(locale ? { locale } : {}),
      // draftAndPublish types are created as drafts unless asked otherwise —
      // a `publishedAt` in `data` does not publish them.
      ...(status ? { status } : {}),
    })
  } catch (error) {
    console.error({ model, entry, error })
  }
}

// Backdate a published document. Publishing stamps `publishedAt` with the
// moment it ran, so it has to be rewritten afterwards — and at the db layer,
// because the Document Service would just re-stamp it. The `$notNull` filter
// leaves the draft row alone: a draft with a `publishedAt` reads as published.
async function backdatePublishedAt(model, documentId, publishedAt) {
  await strapi.db.query(`api::${model}.${model}`).updateMany({
    where: { documentId, publishedAt: { $notNull: true } },
    data: { publishedAt },
  })
}

// Add a translation of an existing document. In Strapi 5 an update against a
// locale that has no entry yet creates that locale's variant.
async function createTranslation({ model, documentId, locale, entry, status }) {
  try {
    return await strapi.documents(`api::${model}.${model}`).update({
      documentId,
      locale,
      data: entry,
      ...(status ? { status } : {}),
    })
  } catch (error) {
    console.error({ model, documentId, locale, error })
  }
}

async function importLocales() {
  const localeService = strapi.plugin('i18n').service('locales')

  for (const locale of LOCALES) {
    const existing = await localeService.findByCode(locale.code)
    if (!existing) {
      await localeService.create(locale)
    }
  }
}

async function checkFileExistsBeforeUpload(files) {
  const existingFiles = []
  const uploadedFiles = []
  // Names with no file behind them drop out here, so a slider whose photographs
  // were never supplied seeds as an empty gallery rather than crashing.
  const filesCopy = [...files].filter(fileExists)

  for (const fileName of filesCopy) {
    // Check if the file already exists in Strapi
    const fileWhereName = await strapi.query('plugin::upload.file').findOne({
      where: {
        name: fileName.replace(/\..*$/, ''),
      },
    })

    if (fileWhereName) {
      // File exists, don't upload it
      existingFiles.push(fileWhereName)
    } else {
      // File doesn't exist, upload it
      const fileData = getFileData(fileName)
      const fileNameNoExtension = fileName.split('.').shift()
      const [file] = await uploadFile(fileData, fileNameNoExtension)
      uploadedFiles.push(file)
    }
  }
  const allFiles = [...existingFiles, ...uploadedFiles]
  // If only one file then return only that file
  return allFiles.length === 1 ? allFiles[0] : allFiles
}

async function updateBlocks(blocks, createdArticles = []) {
  const updatedBlocks = []
  for (const block of blocks) {
    if (block.__component === 'sections.hero') {
      updatedBlocks.push({
        ...block,
        background: await media(block.background),
        decoration: await media(block.decoration),
      })
    } else if (block.__component === 'sections.feature') {
      updatedBlocks.push({
        ...block,
        article: relationId(createdArticles, block.article),
      })
    } else if (block.__component === 'shared.media') {
      const uploadedFiles = await checkFileExistsBeforeUpload([block.file])
      // Copy the block to not mutate directly
      const blockCopy = { ...block }
      // Replace the file name on the block with the actual file
      blockCopy.file = uploadedFiles
      updatedBlocks.push(blockCopy)
    } else if (block.__component === 'shared.slider') {
      // Get files already uploaded to Strapi or upload new files
      const existingAndUploadedFiles = await checkFileExistsBeforeUpload(
        block.files,
      )
      // Copy the block to not mutate directly
      const blockCopy = { ...block }
      // Replace the file names on the block with the actual files
      blockCopy.files = existingAndUploadedFiles
      // Push the updated block
      updatedBlocks.push(blockCopy)
    } else {
      // Just push the block as is
      updatedBlocks.push(block)
    }
  }

  return updatedBlocks
}

// Resolve a dynamiczone only when the source object carries one. A translation
// that leaves `blocks` out must not be handed `blocks: []`, which would empty
// that locale's body instead of leaving the field alone.
async function blocksOf(entry) {
  return entry.blocks ? await updateBlocks(entry.blocks) : undefined
}

async function sectionsOf(entry, createdArticles) {
  return entry.sections
    ? await updateBlocks(entry.sections, createdArticles)
    : undefined
}

// data.json points at related entries by slug, not by position or database id —
// ids differ on any database that has been seeded before, and a slug says what
// it means at the reference site.
//
// The value handed back is a `documentId`: Strapi 5's Document Service keys
// relations on documentId, not on the numeric `id` that also comes back on
// every created entry. Passing the number leaves the relation unset.
function relationId(created, slug) {
  if (!slug) return null
  const match = created.find((entry) => entry && entry.slug === slug)
  return match ? match.documentId : null
}

/**
 * Every collection below is seeded the same way: create the base entry, then add
 * one localization per entry in that type's translation map, keyed by slug.
 *
 * The importers differ only in what has to be resolved before the data is handed
 * over — media, relations, dynamiczones — which is what `base` and `localized`
 * are for.
 *
 * `localized` receives the base entry alongside the translation, because a
 * relation on a localized type is held *per locale*: Strapi does not copy it
 * across from the default locale the way it copies a shared scalar. A
 * translation that omits `author` is not inheriting it, it simply has none —
 * which is how every Arabic article came to render with no byline, no category
 * and no hub. Each locale has to be told again.
 */
async function importCollection({
  model,
  entries,
  translations = {},
  status,
  base = async (entry) => entry,
  localized = async (translation) => translation,
}) {
  const created = []

  for (const entry of entries) {
    const doc = await createEntry({ model, entry: await base(entry), status })
    if (!doc) continue
    // `slug` is carried alongside so `relationId` can resolve later references
    // without another round trip — Strapi returns it on the created document.
    created.push(doc)

    for (const [locale, bySlug] of Object.entries(translations)) {
      const translation = bySlug[entry.slug]
      if (!translation) continue

      await createTranslation({
        model,
        documentId: doc.documentId,
        locale,
        // `slug` is shared (`i18n.localized: false`) and `required` on most of
        // these types, and a localization is created by *updating* into a new
        // locale — so Strapi validates the payload it is handed and rejects it
        // with "slug must be a `string` type, but the final value was: `null`"
        // when the translation leaves it out. Re-sending the same value is a
        // no-op on a shared field and the cheapest way to satisfy the validator.
        // Without it the whole locale silently fails to seed, which is the
        // "hubs pointing at nothing" case `useHubs()` guards against.
        entry: { slug: entry.slug, ...(await localized(translation, entry)) },
        status,
      })
    }
  }

  return created
}

// The fixture an imported document came from.
//
// `importCollection` returns only the entries that actually imported — it drops
// whatever `createEntry` logged and gave up on — so the result cannot be indexed
// against the source list: one failed create shifts every later position and
// silently backdates unrelated entries. Both sides carry `slug`, so match on it.
function sourceOf(entries, doc) {
  return entries.find((entry) => entry.slug === doc.slug) ?? {}
}

// Seeded articles are dated backwards from seed time, so the news feed has more
// than one month bucket and `sort: publishedAt:desc` has something to sort by.
// Without this every article shares the seed's timestamp to the millisecond.
function daysAgo(publishedDaysAgo) {
  const date = new Date()
  date.setDate(date.getDate() - (publishedDaysAgo ?? 0))
  return date.toISOString()
}

// Seeded events are dated relative to seed time so they never go stale and drop
// off the "upcoming" filter. A negative `startsInDays` is deliberate: the events
// archive (`/events?when=past`) needs something behind it on a fresh seed, or a
// fork's first look at it is an empty state.
function eventDate(startsInDays, time) {
  const [hours, minutes] = time.split(':').map(Number)
  const date = new Date()
  date.setDate(date.getDate() + startsInDays)
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

// Categories carry translations for a reason beyond the pill on a card: an
// `ar` article can only point at a category that exists in `ar`, so an
// untranslated category would take every Arabic article's category down with it.
async function importCategories() {
  return importCollection({
    model: 'category',
    entries: categories,
    translations: categoryTranslations,
  })
}

// `draftAndPublish` is off on hubs, ranks and pilots, so no status is passed
// for those three.
async function importHubs() {
  return importCollection({
    model: 'hub',
    entries: hubs,
    translations: hubTranslations,
    base: async (hub) => ({ ...hub, cover: await media(hub.cover) }),
  })
}

async function importRanks() {
  return importCollection({
    model: 'rank',
    entries: ranks,
    translations: rankTranslations,
    base: async (rank) => ({ ...rank, badge: await media(rank.badge) }),
  })
}

// Pilots are the crew roster, the staff list and whoever writes the articles —
// one directory rather than a component array on `about` and a separate
// `author` type.
//
// `photo` is a shared (non-localized) field, so it is resolved on the base entry
// only; re-sending it per locale would be a no-op at best.
async function importPilots(createdHubs, createdRanks) {
  return importCollection({
    model: 'pilot',
    entries: pilots,
    translations: pilotTranslations,
    base: async (pilot) => ({
      ...pilot,
      photo: await media(pilot.photo),
      hub: relationId(createdHubs, pilot.hub),
      rank: relationId(createdRanks, pilot.rank),
    }),
    localized: async (translation, pilot) => ({
      ...translation,
      hub: relationId(createdHubs, pilot.hub),
      rank: relationId(createdRanks, pilot.rank),
    }),
  })
}

async function importArticles(createdCategories, createdPilots, createdHubs) {
  const created = await importCollection({
    model: 'article',
    entries: articles,
    translations: articleTranslations,
    status: 'published',
    base: async (article) => {
      const { publishedDaysAgo, ...rest } = article
      return {
        ...rest,
        // Articles may ship without photographs — the UI renders its placeholder.
        cover: await media(article.cover),
        blocks: await blocksOf(article),
        author: relationId(createdPilots, article.author),
        category: relationId(createdCategories, article.category),
        // Left unset on purpose for some articles: network-wide content is what
        // `showUnassignedInHubViews` exists to decide about.
        hub: relationId(createdHubs, article.hub),
      }
    },
    localized: async (translation, article) => ({
      ...translation,
      blocks: await blocksOf(translation),
      // Restated per locale — see `importCollection`. Every target here is
      // translated in the same locales, which is what keeps this from tripping
      // the "Document with id … locale not found" ValidationError.
      author: relationId(createdPilots, article.author),
      category: relationId(createdCategories, article.category),
      hub: relationId(createdHubs, article.hub),
    }),
  })

  for (const doc of created) {
    await backdatePublishedAt(
      'article',
      doc.documentId,
      daysAgo(sourceOf(articles, doc).publishedDaysAgo),
    )
  }

  return created
}

async function importEvents(createdHubs) {
  return importCollection({
    model: 'event',
    entries: events,
    translations: eventTranslations,
    status: 'published',
    base: async (event) => {
      const { startsInDays, startsAtTime, endsAtTime, ...rest } = event
      return {
        ...rest,
        startsAt: eventDate(startsInDays, startsAtTime),
        endsAt: endsAtTime ? eventDate(startsInDays, endsAtTime) : null,
        // An event cover is usually a poster with words on it, so unlike an
        // article's photograph it stays localized and is resolved per locale.
        cover: await media(event.cover),
        blocks: await blocksOf(event),
        hub: relationId(createdHubs, event.hub),
      }
    },
    // Same fallback as `importDocuments`: an event cover is localized because
    // it is usually a poster with words on it, but a translation that names no
    // poster of its own should show the original rather than nothing.
    localized: async (translation, event) => ({
      ...translation,
      cover: await media(translation.cover ?? event.cover),
      blocks: await blocksOf(translation),
      hub: relationId(createdHubs, event.hub),
    }),
  })
}

// NOTAMs, ops bulletins and urgent notices. `expiresAt` is stored relative to
// seed time for the same reason event dates are — a fixed date in the fixture
// would be long past by the time anyone forks this.
async function importAnnouncements(createdHubs) {
  const created = await importCollection({
    model: 'announcement',
    entries: announcements,
    translations: announcementTranslations,
    status: 'published',
    base: async (announcement) => {
      const { publishedDaysAgo, expiresInDays, ...rest } = announcement
      return {
        ...rest,
        expiresAt: expiresInDays === undefined ? null : daysAgo(-expiresInDays),
        hub: relationId(createdHubs, announcement.hub),
      }
    },
    localized: async (translation, announcement) => ({
      ...translation,
      hub: relationId(createdHubs, announcement.hub),
    }),
  })

  for (const doc of created) {
    await backdatePublishedAt(
      'announcement',
      doc.documentId,
      daysAgo(sourceOf(announcements, doc).publishedDaysAgo),
    )
  }

  return created
}

// The fleet: one entry per airframe, each based at a hub. `fleetStatus` rather
// than `status` because Strapi reserves that name on a draftAndPublish type —
// it collides with the Document Service's own `status` query parameter.
async function importFleet(createdHubs) {
  return importCollection({
    model: 'aircraft',
    entries: fleet,
    translations: fleetTranslations,
    status: 'published',
    base: async (aircraft) => ({
      ...aircraft,
      cover: await media(aircraft.cover),
      blocks: await blocksOf(aircraft),
      hub: relationId(createdHubs, aircraft.hub),
    }),
    localized: async (translation, aircraft) => ({
      ...translation,
      blocks: await blocksOf(translation),
      hub: relationId(createdHubs, aircraft.hub),
    }),
  })
}

async function importDestinations() {
  return importCollection({
    model: 'destination',
    entries: destinations,
    translations: destinationTranslations,
    status: 'published',
    base: async (destination) => ({
      ...destination,
      cover: await media(destination.cover),
      blocks: await blocksOf(destination),
    }),
    localized: async (translation) => ({
      ...translation,
      blocks: await blocksOf(translation),
    }),
  })
}

// SOPs, approach charts, livery kits, joining forms. `file` is localized on
// purpose — a translated manual is a different PDF, not the same one
// relabelled — so each locale resolves its own.
//
// A document whose file was never supplied is skipped entirely rather than
// created without one: `file` is required in the schema, so creating it would
// only produce a ValidationError per entry.
async function importDocuments() {
  return importCollection({
    model: 'document',
    entries: documents.filter((doc) => fileExists(doc.file ?? '')),
    translations: documentTranslations,
    status: 'published',
    base: async (doc) => ({ ...doc, file: await media(doc.file) }),
    // Falls back to the base entry's file. `file` is localized because a
    // translated manual is usually a different PDF — but a fork that has only
    // one bilingual document should get it in both locales, and Strapi does not
    // copy a localized media field across on its own. Omitting the key does not
    // help: the localization is simply created without a file, and the row then
    // disappears from that locale's list.
    localized: async (translation, doc) => ({
      ...translation,
      file: await media(translation.file ?? doc.file),
    }),
  })
}

async function importPages() {
  return importCollection({
    model: 'page',
    entries: pages,
    translations: pageTranslations,
    status: 'published',
    base: async (page) => ({ ...page, blocks: await blocksOf(page) }),
    localized: async (translation) => ({
      ...translation,
      blocks: await blocksOf(translation),
    }),
  })
}

async function importGlobal() {
  // Shared (non-localized) fields, so they are set once on the base entry and
  // every locale reads the same file.
  const favicon = await media(global.favicon)
  const logo = await media(global.logo)
  const heroBackground = await media(global.heroBackground)
  const heroDecoration = await media(global.heroDecoration)
  const shareImage = await media(global.defaultSeo?.shareImage)

  const created = await createEntry({
    model: 'global',
    entry: {
      ...global,
      favicon,
      logo,
      heroBackground,
      heroDecoration,
      // Make sure it's not a draft
      publishedAt: Date.now(),
      defaultSeo: {
        ...global.defaultSeo,
        shareImage,
      },
    },
  })

  if (!created) return

  for (const [locale, translation] of Object.entries(globalTranslations)) {
    await createTranslation({
      model: 'global',
      documentId: created.documentId,
      locale,
      entry: {
        ...translation,
        defaultSeo: {
          ...translation.defaultSeo,
          shareImage,
        },
        publishedAt: Date.now(),
      },
    })
  }
}

async function importHome(createdArticles) {
  const created = await createEntry({
    model: 'home',
    entry: {
      ...home,
      sections: await sectionsOf(home, createdArticles),
      // Make sure it's not a draft
      publishedAt: Date.now(),
    },
    status: 'published',
  })

  if (!created) return

  for (const [locale, translation] of Object.entries(homeTranslations)) {
    await createTranslation({
      model: 'home',
      documentId: created.documentId,
      locale,
      entry: {
        ...translation,
        sections: await sectionsOf(translation, createdArticles),
      },
      status: 'published',
    })
  }
}

async function importAbout() {
  const created = await createEntry({
    model: 'about',
    entry: {
      ...about,
      blocks: await blocksOf(about),
      // Make sure it's not a draft
      publishedAt: Date.now(),
    },
  })

  if (!created) return

  // `about` is a single type but it is localized now, so it takes translations
  // the same way a collection entry does — keyed by locale, not by slug.
  for (const [locale, translation] of Object.entries(aboutTranslations)) {
    await createTranslation({
      model: 'about',
      documentId: created.documentId,
      locale,
      entry: {
        ...translation,
        blocks: await blocksOf(translation),
      },
    })
  }
}

async function importSeedData() {
  // Allow read of application content types
  await setPublicPermissions({
    article: ['find', 'findOne'],
    category: ['find', 'findOne'],
    pilot: ['find', 'findOne'],
    rank: ['find', 'findOne'],
    event: ['find', 'findOne'],
    announcement: ['find', 'findOne'],
    aircraft: ['find', 'findOne'],
    destination: ['find', 'findOne'],
    airport: ['find', 'findOne'],
    flight: ['find', 'findOne'],
    // ponytail: `api::document.document` reads awkwardly next to Strapi's own
    // Document Service. Taken deliberately — editors call these documents.
    document: ['find', 'findOne'],
    global: ['find', 'findOne'],
    home: ['find', 'findOne'],
    about: ['find', 'findOne'],
    hub: ['find', 'findOne'],
    page: ['find', 'findOne'],
  })

  // Order is forced by the relations. Hubs first: pilots, aircraft, articles,
  // events and announcements all point at one. Ranks next, then pilots — a
  // pilot holds both a hub and a rank, and carries the article bylines.
  //
  // Every localization of a pilot must exist before an article references one.
  // A localized relation resolves per locale, so an `ar` article pointing at a
  // pilot with no `ar` variant is a hard ValidationError, not a silent null.
  await importLocales()
  const createdCategories = await importCategories()
  const createdHubs = await importHubs()
  const createdRanks = await importRanks()
  const createdPilots = await importPilots(createdHubs, createdRanks)
  const createdArticles = await importArticles(
    createdCategories,
    createdPilots,
    createdHubs,
  )
  await importEvents(createdHubs)
  await importAnnouncements(createdHubs)
  await importFleet(createdHubs)
  await importDestinations()
  await importDocuments()
  await importPages()
  await importHome(createdArticles)
  await importGlobal()
  await importAbout()
}

async function main() {
  const { createStrapi, compileStrapi } = require('@strapi/strapi')

  const appContext = await compileStrapi()
  const app = await createStrapi(appContext).load()

  app.log.level = 'error'

  await seedExampleApp()

  // Teardown only, and only from here down. Closing knex's pool rejects every
  // connection request still pending in it, and nothing awaits those promises —
  // so Node kills a run whose data committed fine, on an unhandled rejection
  // raised *after* the last write. Anything that is not that specific abort
  // still crashes the script.
  process.on('unhandledRejection', (error) => {
    if (error instanceof Error && error.message === 'aborted') return
    throw error
  })

  await app.destroy()

  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

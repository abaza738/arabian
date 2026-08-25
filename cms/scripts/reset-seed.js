'use strict'

// Wipes seeded content + api permissions and clears the seed's `initHasRun`
// flag, so `pnpm seed:example` can run again on an existing database.
// Admin users and uploaded files are left alone.

// Order matters: anything holding a relation is deleted before its target, so
// `rank` and `hub` come after everything that points at them rather than
// leaving dangling rows. A new collection missing from this list is worse than
// it looks — a reset orphans it and the next seed duplicates it.
const UIDS = [
  // Relation holders. `home` leads: its `sections.feature` components point at
  // articles, so it has to go before them.
  'api::home.home',
  'api::article.article',
  'api::event.event',
  'api::announcement.announcement',
  'api::aircraft.aircraft',
  'api::document.document',
  'api::destination.destination',
  'api::page.page',
  'api::pilot.pilot',
  // Relation targets
  'api::rank.rank',
  'api::hub.hub',
  'api::category.category',
  // Single types
  'api::global.global',
  'api::about.about',
]

async function main() {
  // This deletes every article, event, announcement, aircraft, document,
  // destination, page, pilot, rank, hub and category in the database.
  // A stray `pnpm reset-seed` against a live CMS is unrecoverable
  // without a backup, so production has to be opted into explicitly.
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.RESET_SEED_CONFIRM !== 'yes'
  ) {
    console.error(
      'Refusing to wipe content with NODE_ENV=production.\n' +
        'If that is really what you want, re-run with RESET_SEED_CONFIRM=yes.',
    )
    process.exit(1)
  }

  const { createStrapi, compileStrapi } = require('@strapi/strapi')
  const app = await createStrapi(await compileStrapi()).load()
  app.log.level = 'error'

  for (const uid of UIDS) {
    const { count } = await strapi.db.query(uid).deleteMany({})
    console.log(`deleted ${count} from ${uid}`)
  }

  const permissions = strapi.db.query('plugin::users-permissions.permission')
  const apiPermissions = (await permissions.findMany({})).filter((p) =>
    p.action.startsWith('api::'),
  )
  for (const permission of apiPermissions) {
    await permissions.delete({ where: { id: permission.id } })
  }
  console.log(`deleted ${apiPermissions.length} api permissions`)

  await strapi
    .store({
      environment: strapi.config.environment,
      type: 'type',
      name: 'setup',
    })
    .set({ key: 'initHasRun', value: false })
  console.log('initHasRun reset')

  // Same teardown race as seed.js: the pool rejects its pending connection
  // requests on close, and nothing is awaiting them.
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

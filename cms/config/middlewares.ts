import type { Core } from '@strapi/strapi'

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  // Before `strapi::query`: it edits the raw querystring, which that middleware
  // is what parses.
  'global::public-published-only',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
]

export default config

import type { Core } from '@strapi/strapi'

/**
 * Strapi grants `find` / `findOne` per content type, not per publication
 * status. The same permission that lets the public site read published
 * articles also answers `GET /api/articles?status=draft`, so every unpublished
 * draft is readable by anyone who guesses the query parameter. There is no
 * switch for this in the admin, so the parameter is stripped here for callers
 * that arrive without credentials, which puts them back on Strapi's default of
 * `published`.
 *
 * It runs before `strapi::query` and edits the raw querystring rather than the
 * parsed `ctx.query`, because after parsing the object is a deep structure that
 * cannot be reassigned through Koa's setter without mangling nested keys.
 */
const middleware: Core.MiddlewareFactory = () => {
  return async (ctx, next) => {
    // ponytail: an absent Authorization header is the public-role signal. A
    // global middleware runs before the route's auth chain populates
    // `ctx.state.auth`, so the header is the only thing to read this early.
    // Authenticated callers — API tokens, admin JWTs, the content manager —
    // keep full draft access. Move this to a route policy if the public site
    // ever starts sending a token.
    const isAnonymousContentApi =
      ctx.path.startsWith('/api/') && !ctx.request.header.authorization

    if (isAnonymousContentApi) {
      const params = new URLSearchParams(ctx.request.querystring)

      if (params.has('status')) {
        params.delete('status')
        ctx.request.querystring = params.toString()
      }
    }

    await next()
  }
}

export default middleware

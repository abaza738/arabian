/**
 * The Strapi filter that scopes articles or events to one hub.
 *
 * Content with no hub is network-wide. Whether a hub view claims it is an
 * editorial decision, not a code one — hence `includeShared`, which every caller
 * reads off `global.showUnassignedInHubViews`.
 */
export const hubFilter = (
  slug: string,
  includeShared: boolean,
): CmsFilters<{ hub?: CmsHub | null }> =>
  includeShared
    ? {
        $or: [{ hub: { slug: { $eq: slug } } }, { hub: { $null: true } }],
      }
    : { hub: { slug: { $eq: slug } } }

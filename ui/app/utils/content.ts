/**
 * Absolute URL for an entry's cover image, preferring `format` and falling back
 * to the original upload. Returns null when the entry has no cover, which is
 * what AppPhoto uses to decide between an <img> and its placeholder.
 */
export function coverUrl(
  entry: { cover?: CmsMedia | null } | null | undefined,
  format: CmsMediaFormatName = 'small',
): string | null {
  const cover = entry?.cover
  const url = cover?.formats?.[format]?.url ?? cover?.url
  return url ? mediaUrl(url) : null
}

/**
 * Pill variant for an article's category, grey when uncategorised.
 *
 * The editor's `color`, not the slug. A slug is an address — renaming one must
 * not repaint the site — and a category an admin invents has a slug AppPill has
 * never heard of, which used to render as an unstyled pill.
 */
export function categoryVariant(
  entry: { category?: CmsCategory | null } | null | undefined,
): CmsCategoryColor {
  return entry?.category?.color ?? 'grey'
}

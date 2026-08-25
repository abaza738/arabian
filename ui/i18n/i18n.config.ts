export default defineI18nConfig(() => ({
  legacy: false,
  // A partial translation added later resolves against English, not raw keys.
  fallbackLocale: 'en',
}))

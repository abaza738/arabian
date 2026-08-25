<script setup lang="ts">
const siteUrl = useSiteConfig().url
const localeHead = useLocaleHead()
useHeadSafe(() => {
  const head = toValue(localeHead)
  return {
    ...head,
    link: (head.link ?? []).map((l) => ({
      ...l,
      href: siteUrl && l.href ? new URL(l.href, siteUrl).toString() : l.href,
    })),
  }
})

const { data: global } = await useGlobal()

const appName = computed(() => global.value?.siteName ?? 'Arabian')
const appDescription = computed(
  () =>
    global.value?.defaultSeo?.metaDescription ??
    global.value?.siteDescription ??
    'Arabian — a virtual airline.',
)
const shareImage = computed(() => {
  const url = mediaUrl(global.value?.defaultSeo?.shareImage?.url)
  return url.startsWith('https://') ? url : ''
})

useSeoMeta({
  titleTemplate: '%s',
  title: appName,
  ogTitle: appName,
  description: appDescription,
  ogDescription: appDescription,
  ogType: 'website',
  ogImage: () => shareImage.value || undefined,
  twitterCard: () => (shareImage.value ? 'summary_large_image' : undefined),
})

if (!shareImage.value) {
  defineOgImage('Card.takumi', {
    title: appName.value,
    subtitle:
      global.value?.ribbonTagline ?? global.value?.siteDescription ?? '',
  })
}

const organization = computed(() => ({
  name: appName.value,
  description: appDescription.value,
  email: global.value?.contactEmail || undefined,
  telephone: global.value?.contactPhone || undefined,
  address: global.value?.contactAddress
    ? {
        '@type': 'PostalAddress' as const,
        streetAddress: global.value.contactAddress,
      }
    : undefined,
  sameAs: (global.value?.socialLinks ?? [])
    .map((l) => externalUrl(l.url))
    .filter(Boolean),
}))

useSchemaOrg([defineOrganization(organization)])

const favicon = computed(() => global.value?.favicon)
useHead({
  link: () =>
    favicon.value
      ? [
          {
            rel: 'icon',
            href: mediaUrl(favicon.value.url),
            type: favicon.value.mime,
          },
        ]
      : [],
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

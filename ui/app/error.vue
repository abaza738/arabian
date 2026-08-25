<script setup lang="ts">
import type { NuxtError } from '#app'

const { error } = defineProps<{ error: NuxtError }>()

const { t } = useI18n()
const localePath = useLocalePath()

// Deliberately fetches nothing. This page has to render when Strapi is the
// thing that is down, so it cannot depend on `useGlobal()` the way the default
// layout does.
const isNotFound = computed(() => error.status === 404)

useSeoMeta({
  title: () => (isNotFound.value ? t('error.notFoundTitle') : t('error.title')),
  robots: 'noindex',
})
</script>

<template>
  <div class="inner error-page">
    <p class="error-code">{{ error.statusCode }}</p>

    <h1 class="error-title">
      {{ isNotFound ? t('error.notFoundTitle') : t('error.title') }}
    </h1>

    <p class="error-body">
      {{ isNotFound ? t('error.notFoundBody') : t('error.body') }}
    </p>

    <AppButton :to="localePath({ name: 'index' })">
      {{ t('error.home') }} <span class="arrow">→</span>
    </AppButton>
  </div>
</template>

<style scoped>
.error-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: var(--space-3-5);
  padding-block: var(--space-12);
  min-height: 70vh;
}

.error-code {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-lg);
  color: var(--color-text-tertiary);
}

.error-title {
  font-size: var(--text-display-md);
}

.error-body {
  font-size: var(--text-base);
  line-height: var(--leading-loose);
  color: var(--color-text-secondary);
  max-width: 46ch;
}
</style>

<script setup lang="ts">
defineProps<{ links?: CmsSocialLink[] | null }>()

const { t } = useI18n()
</script>

<template>
  <div v-if="links?.length" class="social-strip">
    <div class="inner social-inner">
      <span class="social-label">{{ t('social.followUs') }}</span>
      <a
        v-for="link in links"
        :key="link.id"
        :href="externalUrl(link.url)"
        class="social-pill"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ SOCIAL_PLATFORMS[link.platform]?.label ?? link.platform }}
      </a>
    </div>
  </div>
</template>

<style scoped>
.social-strip {
  background: var(--color-surface-muted);
  padding: var(--space-3) 0;
}
.social-inner {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2-5);
}
.social-label {
  font-size: var(--text-2xs);
  letter-spacing: var(--tracking-sm);
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  margin-inline-end: var(--space-1);
}
.social-pill {
  font-size: var(--text-2xs);
  color: var(--color-text-secondary);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  background: var(--color-surface-subtle);
  cursor: pointer;
  transition:
    background var(--transition),
    color var(--transition);
}
.social-pill:hover {
  background: var(--color-surface-raised);
  color: var(--color-text);
}
</style>

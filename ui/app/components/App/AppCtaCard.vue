<script setup lang="ts">
const { card } = defineProps<{ card: CmsCtaCard }>()
</script>

<template>
  <div :class="card.variant === 'support' ? 'donate-card' : 'join-card'">
    <div v-if="card.eyebrow" class="section-sup">{{ card.eyebrow }}</div>
    <div class="join-title">{{ card.title }}</div>
    <p v-if="card.body" class="join-text">{{ card.body }}</p>
    <AppButton v-if="card.buttonLabel" :to="localeUrl(card.buttonUrl)">
      {{ card.buttonLabel }}
    </AppButton>
  </div>
</template>

<style scoped>
.join-card {
  background: var(--color-accent-muted);
  border-radius: 14px;
  padding: var(--space-6);
}
.donate-card {
  background: var(--color-support-muted);
  border-radius: 14px;
  padding: var(--space-6);
}
.join-title {
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  color: var(--color-text);
  margin-bottom: var(--space-2);
}
.join-text {
  font-size: var(--text-md);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
  font-weight: var(--weight-light);
  margin-bottom: var(--space-4);
}
</style>

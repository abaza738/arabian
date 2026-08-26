<script setup lang="ts">
const { hero } = defineProps<{
  hero: CmsHero
  background?: CmsMedia | null
  decoration?: CmsMedia | null
  showScene?: boolean
}>()
</script>

<template>
  <section class="hero" :class="{ 'hero-scrimmed': background }">
    <img
      v-if="background"
      class="hero-bg"
      :src="mediaUrl(background.url)"
      alt=""
      aria-hidden="true"
      fetchpriority="high"
    />

    <AppHeroScene v-if="showScene" />

    <img
      v-if="decoration"
      class="hero-decoration"
      :src="mediaUrl(decoration.url)"
      :alt="decoration.alternativeText ?? ''"
    />

    <div class="inner hero-inner">
      <p v-if="hero.greeting" class="hero-greeting">{{ hero.greeting }}</p>

      <Markdown
        :value="hero.headline"
        tag="h1"
        unwrap="p"
        class="hero-headline"
      />

      <p v-if="hero.body" class="hero-body">{{ hero.body }}</p>

      <div
        v-if="hero.primaryCta || hero.secondaryCta"
        class="flex flex-wrap items-center gap-md"
      >
        <AppButton
          v-if="hero.primaryCta"
          variant="light"
          size="lg"
          :to="localeUrl(hero.primaryCta.url)"
        >
          {{ hero.primaryCta.label }}
        </AppButton>

        <AppButton
          v-if="hero.secondaryCta"
          variant="outline-light"
          size="lg"
          :to="localeUrl(hero.secondaryCta.url)"
        >
          {{ hero.secondaryCta.label }}
        </AppButton>
      </div>
    </div>

    <span v-if="hero.footnote" class="hero-footnote">{{ hero.footnote }}</span>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  background: var(--color-accent-deep);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: calc(100dvh - var(--nav-stack-height));
  padding-block: var(--space-12);
}

.hero-scrimmed::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: var(--color-overlay);
}

.hero-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.7;
  mix-blend-mode: overlay;
}

.hero-decoration {
  position: absolute;
  top: var(--space-10);
  inset-inline-end: var(--layout-gutter);
  max-width: 150px;
  border-radius: var(--space-1);
  height: auto;
  z-index: var(--z-sticky);
}

.hero-inner {
  position: relative;
  z-index: var(--z-sticky);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-6);
  text-align: start;
}

.hero-greeting {
  display: flex;
  align-items: center;
  gap: var(--space-3-5);
  font-size: var(--text-sm);
  font-weight: var(--weight-normal);
  font-family: var(--font-serif);
  letter-spacing: var(--tracking-xl);
  text-transform: uppercase;
  color: var(--color-on-accent-deep-muted);
}

.hero-inner :deep(.hero-headline) {
  font-family: var(--font-serif);
  font-size: var(--text-display-hero);
  font-weight: var(--weight-medium);
  line-height: var(--leading-tight);
  letter-spacing: -0.5px;
  color: var(--color-on-accent-deep);
  max-width: 17ch;
}
.hero-inner :deep(.hero-headline em) {
  font-style: italic;
  font-weight: var(--weight-normal);
  color: var(--color-gold);
}

.hero-body {
  font-size: var(--text-lg);
  font-weight: var(--weight-light);
  line-height: var(--leading-loose);
  color: var(--color-on-accent-deep-muted);
  max-width: 54ch;
}

.hero-footnote {
  position: absolute;
  bottom: var(--space-9);
  inset-inline-end: var(--layout-gutter);
  z-index: var(--z-sticky);
  font-family: var(--font-serif);
  font-style: italic;
  font-size: var(--text-md);
  letter-spacing: var(--tracking-sm);
  color: var(--color-on-accent-deep-muted);
}

@media (max-width: 900px) {
  .hero-decoration {
    display: none;
  }
}

@media (max-width: 720px) {
  .hero-footnote {
    position: static;
    align-self: flex-start;
    padding-inline: var(--layout-gutter);
    margin-top: var(--space-6);
  }
}

@media (max-width: 560px) {
  .hero-greeting {
    letter-spacing: var(--tracking-lg);
  }
}
</style>

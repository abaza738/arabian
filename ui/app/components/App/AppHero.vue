<script setup lang="ts">
const { hero } = defineProps<{
  hero: CmsHero
  background?: CmsMedia | null
  decoration?: CmsMedia | null
}>()
</script>

<template>
  <section class="hero" :class="{ 'hero-scrimmed': background }">
    <div class="hero-blobs" aria-hidden="true"><span /><span /><span /></div>

    <img
      v-if="background"
      class="hero-bg"
      :src="mediaUrl(background.url)"
      alt=""
      aria-hidden="true"
      fetchpriority="high"
    />

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

.hero-blobs {
  position: absolute;
  inset: 0;
  pointer-events: none;
  filter: blur(6vmax);
  opacity: 0.5;
}

.hero-blobs span {
  position: absolute;
  border-radius: 50%;
}

.hero-blobs span:nth-child(1) {
  width: 36vmax;
  height: 29vmax;
  top: -8%;
  inset-inline-end: 6%;
  background: var(--color-hero-blob-1);
  animation: hero-drift-1 34s ease-in-out infinite;
}

.hero-blobs span:nth-child(2) {
  width: 29vmax;
  height: 26vmax;
  bottom: -14%;
  inset-inline-start: -6%;
  background: var(--color-hero-blob-2);
  animation: hero-drift-2 42s ease-in-out infinite -8s;
}

.hero-blobs span:nth-child(3) {
  width: 21vmax;
  height: 19vmax;
  top: 34%;
  inset-inline-start: 44%;
  background: var(--color-hero-blob-3);
  opacity: 0.55;
  animation: hero-drift-3 50s ease-in-out infinite -19s;
}

@keyframes hero-drift-1 {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(-70px, 50px);
  }
}

@keyframes hero-drift-2 {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(60px, -40px);
  }
}

@keyframes hero-drift-3 {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(50px, 60px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-blobs span {
    animation: none;
  }
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

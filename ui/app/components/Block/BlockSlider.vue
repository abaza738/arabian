<style scoped>
.block-slider {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.block-slider-track {
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.block-slider-img {
  width: 100%;
  /* A fixed 400px was taller than a phone is wide. The ratio keeps the crop
     proportional at every width. */
  aspect-ratio: 16 / 10;
  object-fit: cover;
  display: block;
}

.block-slider-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: var(--color-overlay);
  color: var(--color-ink-on);
  border: none;
  border-radius: var(--radius-full);
  width: 36px;
  height: 36px;
  cursor: pointer;
  font-size: var(--text-base);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition);
}

.block-slider-btn:hover {
  background: var(--color-ink);
}

/* Logical, not physical: the site is LTR today, but an RTL locale would want
   "previous" on the right and these follow without being rewritten. */
.block-slider-btn--prev {
  inset-inline-start: var(--space-3);
}

.block-slider-btn--next {
  inset-inline-end: var(--space-3);
}

.block-slider-dots {
  display: flex;
  justify-content: center;
  gap: var(--space-1-5);
}

.block-slider-dot {
  width: 7px;
  height: 7px;
  border-radius: var(--radius-full);
  background: var(--color-border);
  border: none;
  cursor: pointer;
  padding: 0;
  transition: background var(--transition);
}

.block-slider-dot.active {
  background: var(--color-accent);
}
</style>

<script setup lang="ts">
const { block } = defineProps<{ block: CmsSliderBlock }>()

const index = ref(0)

const images = computed(() => block.files ?? [])

// The slide itself, not just its index. The list comes from the CMS and can be
// empty, so "the image at `index`" is a question with no answer often enough
// that the template branches on the image rather than on the count.
const active = computed(() => images.value[index.value] ?? null)

const step = (by: number) => {
  index.value = (index.value + by + images.value.length) % images.value.length
}
</script>

<template>
  <div v-if="active" class="block-slider">
    <div class="block-slider-track">
      <img
        :src="mediaUrl(active.formats?.large?.url ?? active.url)"
        :alt="active.alternativeText ?? ''"
        class="block-slider-img"
      />

      <button
        v-if="images.length > 1"
        class="block-slider-btn block-slider-btn--prev"
        aria-label="Previous"
        @click="step(-1)"
      >
        &#8592;
      </button>

      <button
        v-if="images.length > 1"
        class="block-slider-btn block-slider-btn--next"
        aria-label="Next"
        @click="step(1)"
      >
        &#8594;
      </button>
    </div>

    <div v-if="images.length > 1" class="block-slider-dots">
      <button
        v-for="(_, i) in images"
        :key="i"
        class="block-slider-dot"
        :class="{ active: i === index }"
        :aria-label="`Go to image ${i + 1}`"
        @click="index = i"
      />
    </div>
  </div>
</template>

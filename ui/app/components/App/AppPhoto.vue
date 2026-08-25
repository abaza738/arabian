<script setup lang="ts">
const {
  src,
  alt = '',
  label,
  ratio = '16 / 9',
  radius,
} = defineProps<{
  src?: string | null
  alt?: string
  label?: string
  /** Aspect ratio, e.g. "4 / 3". A fixed pixel height made the cover taller
   *  than the screen was wide on a phone; the box scales with its column. */
  ratio?: string
  radius?: string
}>()

const style = computed(() => ({
  aspectRatio: ratio,
  borderRadius: radius,
}))
</script>

<template>
  <img v-if="src" :src="src" :alt="alt" class="photo-img" :style="style" />

  <div v-else class="photo" :style="style">
    <svg
      width="26"
      height="22"
      viewBox="0 0 26 22"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="1"
        y="3.5"
        width="24"
        height="17"
        rx="2.5"
        stroke="currentColor"
        stroke-width="1.4"
      />
      <circle
        cx="13"
        cy="12"
        r="4.2"
        stroke="currentColor"
        stroke-width="1.4"
      />
      <path
        d="M9 3.5L10.5 1h5L17 3.5"
        stroke="currentColor"
        stroke-width="1.4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <span v-if="label" class="photo-label">{{ label }}</span>
  </div>
</template>

<style scoped>
/* Tinted against the placeholder gradient's dark end, not its light end — the
   label sits wherever the gradient happens to be under it. */
.photo {
  /* The placeholder is a div, so it needs the width the img gets for free. */
  width: 100%;
  background: linear-gradient(
    150deg,
    var(--color-photo-bg-from) 0%,
    var(--color-photo-bg-to) 100%
  );
  color: var(--color-text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  overflow: hidden;
}
.photo-label {
  font-size: var(--text-3xs);
  font-weight: var(--weight-light);
  letter-spacing: var(--tracking-xs);
}
.photo-img {
  display: block;
  width: 100%;
  object-fit: cover;
}
</style>

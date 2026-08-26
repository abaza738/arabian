<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

type Variant = 'dark' | 'outline' | 'accent' | 'light' | 'outline-light'
type Size = 'sm' | 'md' | 'lg'

const {
  variant = 'dark',
  size = 'md',
  to,
  href,
} = defineProps<{
  variant?: Variant
  size?: Size
  /** A path, or any route object — the filter chips pass `{ query }`. */
  to?: RouteLocationRaw
  href?: string
}>()

const tag = computed(() => {
  if (to) return resolveComponent('NuxtLink')
  if (href) return 'a'
  return 'button'
})
</script>

<template>
  <component
    :is="tag"
    class="btn"
    :data-variant="variant"
    :data-size="size"
    :type="to || href ? undefined : 'button'"
    v-bind="to ? { to } : href ? { href } : {}"
  >
    <slot />
  </component>
</template>

<style scoped>
.btn {
  display: inline-block;
  border-radius: var(--radius-sm);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition:
    filter var(--transition),
    transform var(--transition),
    border-color var(--transition),
    color var(--transition);

  /* `pointer-events` rather than resetting each variant's hover: a disabled
     button still matches `:hover`, and every variant's hover rule outranks a
     plain `:disabled` one. */
  &:disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  &[data-size='sm'] {
    padding: var(--space-1) var(--space-3);
    font-size: var(--text-2xs);
  }

  &[data-size='md'] {
    padding: var(--space-2) var(--space-5);
    font-size: var(--text-sm);
  }

  &[data-size='lg'] {
    padding: var(--space-3) var(--space-7);
    font-size: var(--text-base);
  }

  &[data-variant='dark'] {
    background: var(--color-ink);
    color: var(--color-ink-on);
    font-weight: var(--weight-normal);

    &:hover {
      filter: brightness(1.25);
    }
  }

  &[data-variant='accent'] {
    background: var(--color-accent);
    color: var(--color-accent-on);
    font-weight: var(--weight-normal);

    &:hover {
      filter: brightness(1.1);
    }
  }

  /* The filled pair for a dark surface — the hero is the only one so far.
     Cream on the deep maroon, the same two colours the surface already uses,
     so the CTA reads as part of it. Gold stays a hairline accent elsewhere
     and never becomes a slab. */
  &[data-variant='light'] {
    background: var(--color-on-accent-deep);
    color: var(--color-accent-deep);
    font-weight: var(--weight-medium);

    &:hover {
      filter: brightness(1.06);
    }
  }

  &[data-variant='outline'],
  &[data-variant='outline-light'] {
    background: transparent;

    /* The 1px border is outside the padding box, so each step gives 1px
       back to keep an outline button the same size as a filled one. */
    &[data-size='sm'] {
      padding: calc(var(--space-1) - 1px) calc(var(--space-3) - 1px);
    }
    &[data-size='md'] {
      padding: calc(var(--space-2) - 1px) calc(var(--space-5) - 1px);
    }
    &[data-size='lg'] {
      padding: calc(var(--space-3) - 1px) calc(var(--space-7) - 1px);
    }
  }

  &[data-variant='outline'] {
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);

    &:hover {
      border-color: var(--color-text-tertiary);
      color: var(--color-text);
    }
  }

  &[data-variant='outline-light'] {
    color: var(--color-on-accent-deep);
    border: 1px solid var(--color-on-accent-deep-border);

    &:hover {
      border-color: var(--color-on-accent-deep-faint);
    }
  }
}
</style>

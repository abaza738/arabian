<script setup lang="ts">
/**
 * The share card for a page with no picture of its own — a feed, a hub, an
 * entry with no cover. Chat apps and social posts are the distribution channel
 * here, so the alternative is not "no image", it is the same generic site
 * banner under every link.
 *
 * Defaults on every prop so the template previews in `/__og-image__/`.
 */
const { title = 'Untitled', subtitle = '' } = defineProps<{
  title?: string
  /** The small line under the rule: the site's name, or its tagline on the landing page. */
  subtitle?: string
}>()
</script>

<template>
  <!-- Styles are inline, not a `<style>` block, and every value is a literal:
       this renders outside the app, with none of its stylesheet, and the
       renderer cannot resolve a CSS custom property. So this is the one file
       in the UI exempt from the no-literals rule, and the one place token
       values are duplicated by hand. The four colours mirror `--color-ink`,
       `--color-ink-on`, `--color-ink-border` and `--color-ink-text` in
       `assets/styles/tokens.css`; a fork that rebrands must edit both. -->
  <div
    style="
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 72px;
      background: #2b2b2b;
      color: #f0ede7;
    "
  >
    <div
      style="
        font-size: 62px;
        line-height: 1.15;
        font-weight: 600;
        font-family: 'Marcellus', serif;
      "
    >
      {{ title }}
    </div>

    <div
      style="
        display: flex;
        align-items: center;
        padding-top: 28px;
        border-top: 1px solid #333333;
        font-size: 26px;
        color: #cac7c0;
        font-family: 'Marcellus', serif;
      "
    >
      {{ subtitle }}
    </div>
  </div>
</template>

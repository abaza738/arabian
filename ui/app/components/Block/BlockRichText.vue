<script setup lang="ts">
const { block } = defineProps<{ block: CmsRichTextBlock }>()
</script>

<template>
  <div class="rich-text">
    <Markdown :value="block.body ?? ''" />
  </div>
</template>

<style>
.rich-text {
  font-size: var(--text-base);
  line-height: var(--leading-loose);
  color: var(--color-text);
  /* Markdown is the one place an editor can put a 60-character URL into the
     page. Without this it pushes the whole layout sideways. */
  overflow-wrap: break-word;
}

.rich-text h2 {
  font-family: var(--font-serif);
  font-size: var(--text-display-sm);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
  margin-top: var(--space-10);
  margin-bottom: var(--space-3);
}

.rich-text h3 {
  font-family: var(--font-serif);
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
  margin-top: var(--space-8);
  margin-bottom: var(--space-3);
}

/* Editor-supplied media and wide blocks: the image scales, the things that
   cannot scale get their own scroll container instead of widening the page. */
.rich-text img {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-md);
}

.rich-text pre,
.rich-text table {
  display: block;
  max-width: 100%;
  overflow-x: auto;
}

.rich-text p {
  margin-bottom: var(--space-5);
}

.rich-text ul,
.rich-text ol {
  padding-inline-start: var(--space-6);
  margin-bottom: var(--space-5);
}

.rich-text li {
  margin-bottom: var(--space-2);
}

/* The block zone already puts --space-8 between blocks; edge margins would
   stack on top of that and make the gap between two blocks depend on which
   elements happen to sit at their boundary. */
.rich-text > :first-child {
  margin-top: 0;
}

.rich-text > :last-child {
  margin-bottom: 0;
}

.rich-text strong {
  font-weight: var(--weight-medium);
  color: var(--color-text);
}

.rich-text em {
  font-style: italic;
}

.rich-text a {
  color: var(--color-accent);
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: opacity var(--transition);
}

.rich-text a:hover {
  opacity: 0.75;
}
</style>

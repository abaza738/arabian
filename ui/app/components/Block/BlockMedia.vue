<style scoped>
.block-media {
  margin: 0;
}

.block-media-img,
.block-media-video {
  width: 100%;
  border-radius: var(--radius-md);
  display: block;
}

.block-media-video {
  max-height: 480px;
  background: var(--color-ink);
}

.block-media-file {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1-5);
  font-size: var(--text-md);
  color: var(--color-accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>

<script setup lang="ts">
const { block } = defineProps<{ block: CmsMediaBlock }>()

const file = computed(() => block.file ?? null)

const isImage = computed(() => file.value?.mime.startsWith('image/'))
const isVideo = computed(() => file.value?.mime.startsWith('video/'))

const src = computed(() =>
  file.value ? mediaUrl(file.value.formats?.large?.url ?? file.value.url) : '',
)
</script>

<template>
  <figure v-if="file" class="block-media">
    <img
      v-if="isImage"
      :src="src"
      :alt="file.alternativeText ?? ''"
      class="block-media-img"
    />
    <video v-else-if="isVideo" :src="src" controls class="block-media-video" />
    <a v-else :href="src" target="_blank" class="block-media-file">
      Download file
    </a>
  </figure>
</template>

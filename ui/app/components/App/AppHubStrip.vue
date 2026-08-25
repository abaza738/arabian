<script setup lang="ts">
defineProps<{ hubs: CmsHub[] }>()

const localePath = useLocalePath()
</script>

<template>
  <ul class="hub-links">
    <li v-for="h in hubs" :key="h.documentId">
      <NuxtLink
        :to="localePath({ name: 'hub', params: { slug: h.slug } })"
        class="hub-link"
      >
        <span class="hub-name">{{ h.name }}</span>
        <span v-if="h.iata ?? h.city" class="hub-code">
          {{ h.iata ?? h.city }}
        </span>
      </NuxtLink>
    </li>
  </ul>
</template>

<style scoped>
.hub-links {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-1);
  list-style: none;
}
.hub-link {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2-5) var(--space-3);
  border-radius: var(--radius-sm);
  transition: background var(--transition);
}
.hub-link:hover {
  background: var(--color-surface-subtle);
}
.hub-name {
  font-size: var(--text-md);
  color: var(--color-text);
}
.hub-code {
  font-size: var(--text-xs);
  font-weight: var(--weight-light);
  letter-spacing: var(--tracking-md);
  color: var(--color-text-tertiary);
  white-space: nowrap;
}
</style>

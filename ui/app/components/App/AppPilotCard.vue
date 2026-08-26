<script setup lang="ts">
const { pilot } = defineProps<{ pilot: CmsPilot }>()

const { t, locale } = useI18n()

const hours = computed(() =>
  typeof pilot.hours === 'number'
    ? t('roster.hours', {
        count: new Intl.NumberFormat(locale.value).format(pilot.hours),
      })
    : '',
)

const since = computed(() =>
  pilot.joinedAt
    ? t('roster.since', { year: new Date(pilot.joinedAt).getFullYear() })
    : '',
)
</script>

<template>
  <li class="pilot">
    <img
      v-if="pilot.photo"
      :src="mediaUrl(pilot.photo.url)"
      :alt="pilot.photo.alternativeText ?? pilot.name"
      class="pilot-photo"
      loading="lazy"
    />
    <div v-else class="pilot-photo pilot-photo-empty" aria-hidden="true">
      {{ pilot.name.slice(0, 1) }}
    </div>

    <div class="pilot-name">{{ pilot.name }}</div>
    <div v-if="pilot.callsign" class="pilot-callsign">{{ pilot.callsign }}</div>
    <div v-if="pilot.rank?.name ?? pilot.role" class="pilot-role">
      {{ pilot.rank?.name ?? pilot.role }}
    </div>

    <div v-if="hours || since" class="pilot-meta">
      <span v-if="hours">{{ hours }}</span>
      <span v-if="hours && since" aria-hidden="true">·</span>
      <span v-if="since">{{ since }}</span>
    </div>

    <p v-if="pilot.bio" class="pilot-bio">{{ pilot.bio }}</p>
  </li>
</template>

<style scoped>
.pilot {
  list-style: none;
}

.pilot-photo {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  margin-bottom: var(--space-3);
}
.pilot-photo-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-muted);
  color: var(--color-text-tertiary);
  font-family: var(--font-serif);
  font-size: var(--text-4xl);
}
.pilot-name {
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  color: var(--color-text);
}
.pilot-callsign {
  font-size: var(--text-2xs);
  letter-spacing: var(--tracking-md);
  color: var(--color-text-tertiary);
  margin-top: var(--space-1);
  font-variant-numeric: tabular-nums;
}
.pilot-role {
  font-size: var(--text-2xs);
  letter-spacing: var(--tracking-md);
  text-transform: uppercase;
  color: var(--color-accent);
  margin-top: var(--space-1);
}
.pilot-meta {
  display: flex;
  gap: var(--space-2);
  font-size: var(--text-2xs);
  font-weight: var(--weight-normal);
  color: var(--color-text-tertiary);
  margin-top: var(--space-1);
  font-variant-numeric: tabular-nums;
}
.pilot-bio {
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  font-weight: var(--weight-normal);
  color: var(--color-text-secondary);
  margin-top: var(--space-2);
  overflow-wrap: break-word;
}
</style>

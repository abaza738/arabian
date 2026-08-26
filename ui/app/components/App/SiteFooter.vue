<script setup lang="ts">
const { global, hub } = defineProps<{
  global?: CmsGlobal | null
  hub?: CmsHub | null
}>()

const { t } = useI18n()

const year = new Date().getFullYear()

const where = computed(() => locationLine(hub?.location))
const hubContact = computed(() =>
  hub && (where.value || hub.email || hub.phone) ? hub : null,
)
</script>

<template>
  <footer class="site-footer">
    <div class="footer-grid inner">
      <div>
        <div class="footer-brand">{{ global?.siteName }}</div>
        <p class="footer-desc">{{ global?.siteDescription }}</p>
        <div v-if="global?.wordmarkSub" class="footer-wordmark-sub">
          {{ global.wordmarkSub }}
        </div>
      </div>

      <div v-if="global?.footerLinks?.length">
        <div class="footer-col-title">{{ t('footer.pages') }}</div>
        <NuxtLink
          v-for="link in global.footerLinks"
          :key="link.id"
          :to="localeUrl(link.url)"
          class="footer-link"
        >
          {{ link.label }}
        </NuxtLink>
      </div>

      <div>
        <template v-if="global?.socialLinks?.length">
          <div class="footer-col-title">{{ t('footer.connect') }}</div>
          <div class="flex flex-wrap gap-sm footer-icons">
            <a
              v-for="link in global.socialLinks"
              :key="link.id"
              :href="externalUrl(link.url)"
              class="footer-icon"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="
                SOCIAL_PLATFORMS[link.platform]?.label ?? link.platform
              "
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path :d="SOCIAL_PLATFORMS[link.platform]?.path" />
              </svg>
            </a>
          </div>
        </template>

        <template v-if="hubContact">
          <div class="footer-col-title">{{ hubContact.name }}</div>
          <div v-if="where" class="footer-location">{{ where }}</div>
          <a
            v-if="hubContact.location?.mapUrl"
            :href="hubContact.location.mapUrl"
            class="footer-link footer-contact"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ t('event.viewMap') }}
          </a>
          <a
            v-if="hubContact.email"
            :href="`mailto:${hubContact.email}`"
            class="footer-link footer-contact"
          >
            {{ hubContact.email }}
          </a>
          <a
            v-if="hubContact.phone"
            :href="`tel:${hubContact.phone.replace(/\s+/g, '')}`"
            class="footer-link footer-contact"
          >
            {{ hubContact.phone }}
          </a>
        </template>

        <template v-else-if="global?.location">
          <div class="footer-col-title">{{ t('footer.location') }}</div>
          <div class="footer-location">{{ global.location }}</div>
        </template>
      </div>
    </div>

    <div class="footer-bottom inner">
      <span class="footer-copy">
        © {{ year }} {{ global?.siteName }}. {{ t('footer.rights') }}
      </span>

      <!-- The way back out of the hub, and the only place the page says
           which one you are in once you have scrolled past the nav. -->
      <span v-if="hub" class="footer-copy">
        {{ hub.name }} ·
        {{ t('footer.partOf', { site: global?.siteName }) }}
      </span>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  background: var(--color-ink);
  color: var(--color-ink-text);
}
.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: var(--space-8);
  padding: var(--space-10) var(--layout-gutter) var(--space-7);
}
.footer-brand {
  font-family: var(--font-serif);
  font-size: var(--text-base);
  color: var(--color-ink-text);
  margin-bottom: var(--space-2);
}
.footer-desc {
  font-size: var(--text-sm);
  color: var(--color-ink-text-secondary);
  line-height: var(--leading-loose);
  font-weight: var(--weight-normal);
  max-width: 240px;
}
.footer-col-title {
  font-size: var(--text-3xs);
  letter-spacing: var(--tracking-md);
  text-transform: uppercase;
  color: var(--color-ink-text-muted);
  margin-bottom: var(--space-3);
  font-weight: var(--weight-normal);
}
.footer-link {
  display: block;
  font-size: var(--text-sm);
  color: var(--color-ink-text-secondary);
  font-weight: var(--weight-normal);
  margin-bottom: var(--space-2);
  cursor: pointer;
  text-decoration: none;
  transition: color var(--transition);
}
.footer-link:hover {
  color: var(--color-ink-text);
}
.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-4);
  padding: var(--space-4) var(--layout-gutter);
  border-top: 1px solid var(--color-ink-border);
}
.footer-copy {
  font-size: var(--text-xs);
  color: var(--color-ink-text-muted);
  font-weight: var(--weight-normal);
}
.footer-wordmark-sub {
  margin-top: var(--space-3);
  font-size: var(--text-xs);
  color: var(--color-ink-text-muted);
}
.footer-icons {
  margin-bottom: var(--space-5);
}
.footer-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: var(--color-ink-subtle);
  color: var(--color-ink-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--transition);
}
.footer-icon:hover {
  background: var(--color-ink-subtle-hover);
}
.footer-location {
  font-size: var(--text-sm);
  color: var(--color-ink-text-muted);
  line-height: var(--leading-relaxed);
  white-space: pre-line;
}

.footer-contact {
  margin-top: var(--space-2);
  margin-bottom: 0;
  overflow-wrap: anywhere;
}

@media (max-width: 720px) {
  .footer-grid {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }
  .footer-desc {
    max-width: none;
  }
}

@media (pointer: coarse) {
  .footer-icon {
    width: 44px;
    height: 44px;
  }
}
</style>

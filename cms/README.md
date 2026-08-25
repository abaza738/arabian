# CMS — Strapi

The headless CMS for the Arabian virtual airline site. Manages all content and exposes a REST API consumed by the Nuxt frontend.

## Development

```bash
pnpm install

# Local development server
pnpm dev

# Start without auto-reload (production)
pnpm start

# Build admin panel for production
pnpm build
```

On first run, visit `http://localhost:1337/admin` to create your admin account.

## Environment Variables

Copy `.env.example` to `.env` and fill in all values. See the root [README](../README.md) for descriptions and how to generate secret values.

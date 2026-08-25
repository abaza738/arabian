/** Display names and icon paths for the platforms `shared.social-link` allows. */
export const SOCIAL_PLATFORMS: Record<string, { label: string; path: string }> =
  {
    facebook: {
      label: 'Facebook',
      path: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z',
    },
    instagram: {
      label: 'Instagram',
      path: 'M16 2H8a6 6 0 00-6 6v8a6 6 0 006 6h8a6 6 0 006-6V8a6 6 0 00-6-6zm0 2a4 4 0 014 4v8a4 4 0 01-4 4H8a4 4 0 01-4-4V8a4 4 0 014-4h8zm-4 3a5 5 0 100 10A5 5 0 0012 7zm0 2a3 3 0 110 6 3 3 0 010-6zm5.5-.5a1 1 0 100 2 1 1 0 000-2z',
    },
    x: {
      label: 'X / Twitter',
      path: 'M4 4l16 16M4 20L20 4',
    },
    youtube: {
      label: 'YouTube',
      path: 'M22 8s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C15.6 4 12 4 12 4s-3.6 0-5.8.1c-.6.1-1.9.1-3 1.3C2.3 6 2 8 2 8S1.7 10.3 1.7 12.5v2.1C1.7 16.8 2 19 2 19s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C8.8 23 12 23 12 23s3.6 0 5.8-.1c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8S23 16.8 23 14.6v-2.1C23 10.3 22 8 22 8zm-10 8.5v-8l7 4-7 4z',
    },
  }

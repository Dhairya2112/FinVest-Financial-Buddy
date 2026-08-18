export default function manifest() {
  return {
    name: 'FinVest Terminal',
    short_name: 'FinVest',
    description: 'Industry-grade personal finance management and analytics terminal.',
    start_url: '/',
    display: 'standalone',
    background_color: '#030303',
    theme_color: '#030303',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      // You should eventually add a 192x192 and 512x512 PNG here for proper PWA installation
    ],
  }
}

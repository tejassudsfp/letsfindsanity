import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'letsfindsanity - Support for Builders',
    short_name: 'letsfindsanity',
    description: 'a space for builders to journal, support and ask for advice anonymously !',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/letsfindsanity.png',
        sizes: 'any',
        type: 'image/png',
      },
      {
        src: '/letsfindsanity.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
    categories: ['productivity', 'social', 'lifestyle'],
    orientation: 'portrait',
  }
}
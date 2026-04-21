
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Orçamento Inteligente',
    short_name: 'OrcSmart',
    description: 'Gestão financeira moderna com IA',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1e293b',
    icons: [
      {
        src: 'https://picsum.photos/seed/appicon/192/192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://picsum.photos/seed/appicon/512/512',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}

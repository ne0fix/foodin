import type {Metadata} from 'next';
import './globals.css';

const BASE_URL = 'https://digitalgen.vercel.app';
const OG_IMAGE = `${BASE_URL}/og-image.jpg`;

export const metadata: Metadata = {
  title: 'Super G & N | Supermercado Online',
  description: 'Supermercado Super G & N — Pacatuba, CE. Compre online com entrega rápida.',
  metadataBase: new URL(BASE_URL),
  openGraph: {
    type: 'website',
    url: BASE_URL,
    siteName: 'Super G & N',
    title: 'Super G & N | Supermercado Online',
    description: 'Compre no Super G & N em Pacatuba, CE. Hortifruti, congelados, bebidas e muito mais. Entrega rápida!',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'Super G & N' }],
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Super G & N | Supermercado Online',
    description: 'Compre no Super G & N em Pacatuba, CE. Entrega rápida!',
    images: [OG_IMAGE],
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className="overflow-x-hidden">
      <head>
        {/* Open Graph — WhatsApp, Facebook, LinkedIn */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={BASE_URL} />
        <meta property="og:site_name" content="Super G & N" />
        <meta property="og:title" content="Super G & N | Supermercado Online" />
        <meta property="og:description" content="Compre no Super G & N em Pacatuba, CE. Hortifruti, congelados, bebidas e muito mais. Entrega rápida!" />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Super G & N Supermercado Online" />
        <meta property="og:locale" content="pt_BR" />
        {/* Twitter / WhatsApp fallback */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Super G & N | Supermercado Online" />
        <meta name="twitter:description" content="Compre no Super G & N em Pacatuba, CE. Entrega rápida!" />
        <meta name="twitter:image" content={OG_IMAGE} />
      </head>
      <body className="min-h-screen flex flex-col font-sans bg-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Super G & N | Supermercado Online',
  description: 'Supermercado Super G & N — Av. XVII, 404, Pacatuba - CE. Aberto até 23h.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className="overflow-x-hidden">
      <body className="min-h-screen flex flex-col font-sans bg-white overflow-x-hidden" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

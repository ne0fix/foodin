import type {Metadata} from 'next';
import './globals.css'; // Global styles
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: 'Super G & N | Supermercado Online',
  description: 'Supermercado Super G & N — Av. XVII, 404, Pacatuba - CE. Aberto até 23h.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className="overflow-x-hidden">
      <body className="min-h-screen flex flex-col font-sans bg-white overflow-x-hidden" suppressHydrationWarning>
        <Header />
        <main className="flex-1 flex flex-col">
           {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

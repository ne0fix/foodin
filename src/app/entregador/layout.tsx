import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FoodIN — Entregador',
  description: 'Área do entregador FoodIN',
};

export default function EntregadorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans antialiased">
      {children}
    </div>
  );
}

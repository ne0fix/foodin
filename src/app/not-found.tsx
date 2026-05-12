import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-6xl font-black text-gray-200 mb-4">404</h1>
      <p className="text-gray-600 font-semibold mb-6">Página não encontrada</p>
      <Link href="/" className="bg-green-600 text-white font-bold px-6 py-3 rounded-2xl hover:bg-green-700 transition-colors">
        Voltar ao início
      </Link>
    </div>
  );
}

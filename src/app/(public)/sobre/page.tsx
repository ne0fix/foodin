import Link from 'next/link';
import { MapPin, Phone, Clock } from 'lucide-react';

export const metadata = {
  title: 'Sobre Nós | Super G & N',
  description: 'Conheça o Supermercado Super G & N em Pacatuba, CE.',
};

export default function SobrePage() {
  return (
    <div className="container mx-auto px-4 max-w-3xl py-10 sm:py-16">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">Sobre Nós</h1>
      <p className="text-green-600 font-semibold mb-8">Super G & N — Supermercado</p>

      <div className="prose prose-gray max-w-none mb-10">
        <p className="text-gray-600 leading-relaxed mb-4">
          O Super G & N é um supermercado de bairro localizado em Pacatuba, Ceará. Trabalhamos para oferecer produtos frescos e de qualidade, com preços justos, para as famílias da nossa cidade.
        </p>
        <p className="text-gray-600 leading-relaxed mb-4">
          Nosso compromisso é com a satisfação dos nossos clientes. Por isso, selecionamos fornecedores confiáveis e garantimos que cada produto chegue até você com frescor e sabor.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Com nossa loja online, você pode fazer suas compras de onde estiver e receber tudo no conforto da sua casa.
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-gray-900 text-lg">Informações da Loja</h2>
        <div className="flex items-start gap-3 text-sm text-gray-600">
          <MapPin size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
          <span>Av. XVII, 404 - Sen. Carlos Jereissati, Pacatuba - CE, 61800-000</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <Phone size={16} className="text-green-600 flex-shrink-0" />
          <span>(85) 99113-5449</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <Clock size={16} className="text-green-600 flex-shrink-0" />
          <span>Aberto · Fecha às 23:00</span>
        </div>
      </div>

      <div className="mt-8">
        <Link href="/" className="text-green-600 font-semibold hover:underline text-sm">← Voltar para a loja</Link>
      </div>
    </div>
  );
}

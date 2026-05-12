'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Phone, MapPin, Clock, Camera } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 pt-6 sm:pt-14 pb-8 border-t-4 border-green-600">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Empresa */}
          <div className="col-span-2 lg:col-span-1">
            <div className="mb-2">
              <Image
                src="/foodin.png"
                alt="foodin"
                width={499}
                height={241}
                className="h-10 mb-5 sm:h-12 w-auto drop-shadow-lg"
              />
            </div>
            <p className="text-sm leading-relaxed mb-5">
              Produtos frescos e de qualidade entregues na sua porta. Compramos diretamente dos produtores para garantir o melhor preço.
            </p>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2"><Phone size={14} className="text-green-500 flex-shrink-0" /> (85) 99113-5449</p>
              <p className="flex items-start gap-2"><MapPin size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span>Av. XVII, 404 - Sen. Carlos Jereissati<br />Pacatuba - CE, 61800-000</span>
              </p>
              <p className="flex items-start gap-2"><Clock size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span>Super G & N<br />Aberto · Fecha 23:00</span>
              </p>
            </div>
          </div>

          {/* Links Úteis */}
          <div>
            <h4 className="text-white font-bold mb-5">Links Úteis</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                ['/sobre', 'Sobre nós'],
                ['/politica-de-privacidade', 'Política de privacidade'],
                ['/termos', 'Termos e condições'],
                ['https://wa.me/5585981058342?text=Ol%C3%A1%2C%20preciso%20de%20ajuda!', 'Fale Conosco'],
                ['/cliente/pedidos', 'Rastrear pedido'],
              ].map(([href, label]) => (
                <li key={label}>
                  <Link href={href} className="hover:text-green-400 transition-colors" {...(href.startsWith('https') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categorias */}
          <div>
            <h4 className="text-white font-bold mb-5">Categorias</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                ['hortifruti', '🥦 Hortifruti'],
                ['frutas',     '🍎 Frutas'],
                ['carnes',     '🥩 Carnes'],
                ['laticinios', '🥛 Laticínios'],
                ['padaria',    '🍞 Padaria'],
                ['bebidas',    '🥤 Bebidas'],
                ['mercearia',  '🛒 Mercearia'],
                ['limpeza',    '🧹 Limpeza'],
              ].map(([id, label]) => (
                <li key={id}>
                  <Link href={`/produtos?categoria=${id}`} className="hover:text-green-400 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div className="col-span-2 lg:col-span-1">
            <h4 className="text-white font-bold mb-5">Fale Conosco</h4>
            <p className="text-sm mb-4 leading-relaxed">
              Dúvidas, sugestões ou precisa de ajuda? Nossa equipe está disponível pelo WhatsApp.
            </p>
            <Link
              href="https://wa.me/5585981058342?text=Ol%C3%A1%2C%20preciso%20de%20ajuda!"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-3 rounded-lg font-bold text-sm transition-colors w-full"
            >
              <Phone size={14} /> Chamar no WhatsApp
            </Link>
            <div className="flex gap-3 mt-5">
              <Link href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-800 hover:bg-green-600 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-all">
                <Camera size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* Rodapé inferior */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <p>© 2026 Super G & N. Todos os direitos reservados.</p>
          <div className="flex items-center gap-2">
            {['VISA', 'MASTER', 'PIX', 'BOLETO', 'AMEX'].map(m => (
              <div key={m} className="bg-gray-800 px-2 py-1 rounded text-[10px] font-bold text-gray-400">{m}</div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

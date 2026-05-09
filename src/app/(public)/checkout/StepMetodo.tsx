'use client';

import { QrCode, CreditCard, Zap, Shield } from 'lucide-react';

type Metodo = 'PIX' | 'CARTAO';

interface Props {
  onNext: (metodo: Metodo) => void;
}

export default function StepMetodo({ onNext }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-gray-900">Como deseja pagar?</h2>
        <p className="text-sm text-gray-500 mt-1">Escolha a forma de pagamento para continuar</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* PIX */}
        <button
          type="button"
          onClick={() => onNext('PIX')}
          className="group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-green-200 bg-green-50 hover:border-green-500 hover:bg-green-100 transition-all text-center"
        >
          <div className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center shadow-md shadow-green-600/30 group-hover:scale-105 transition-transform">
            <QrCode size={26} className="text-white" />
          </div>
          <div>
            <p className="font-extrabold text-gray-900 text-lg">PIX</p>
            <p className="text-xs text-gray-500 mt-0.5">Pagamento instantâneo</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-green-700 font-bold bg-green-100 px-3 py-1 rounded-full">
            <Zap size={11} /> Aprovação imediata
          </div>
          <p className="text-[11px] text-gray-400">Sem dados de cartão necessários</p>
        </button>

        {/* Cartão */}
        <button
          type="button"
          onClick={() => onNext('CARTAO')}
          className="group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-gray-200 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 transition-all text-center"
        >
          <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <CreditCard size={26} className="text-white" />
          </div>
          <div>
            <p className="font-extrabold text-gray-900 text-lg">Cartão de crédito</p>
            <p className="text-xs text-gray-500 mt-0.5">Crédito ou débito</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600 font-bold bg-gray-200 px-3 py-1 rounded-full">
            <Shield size={11} /> Processado pelo Mercado Pago
          </div>
          <p className="text-[11px] text-gray-400">Requer CPF do titular</p>
        </button>
      </div>
    </div>
  );
}

const ETAPAS = [
  'PEDIDO_REALIZADO', 'PAGAMENTO_PROCESSANDO', 'APROVADO', 'EM_SEPARACAO', 'LIBERADO'
];

export function OrderTimeline({ statusAtual }: { statusAtual: string }) {
  const idx = ETAPAS.indexOf(statusAtual);
  return (
    <div className="flex items-center gap-0 overflow-x-auto py-2">
      {ETAPAS.map((etapa, i) => {
        const concluido = i <= idx;
        const atual = i === idx;
        return (
          <div key={etapa} className="flex items-center flex-shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2
              ${concluido ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 text-gray-400'}
              ${atual ? 'ring-2 ring-green-600 ring-offset-2' : ''}`}>
              {concluido ? '✓' : i + 1}
            </div>
            {i < ETAPAS.length - 1 && (
              <div className={`h-1 w-12 sm:w-20 ${i < idx ? 'bg-green-600' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

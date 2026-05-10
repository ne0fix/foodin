export function OrderTimeline({ statusAtual, entregaTipo }: { statusAtual: string; entregaTipo?: string }) {
  const labels = [
    'Pedido Realizado',
    'Pagamento Confirmado',
    'Em Separação',
    entregaTipo === 'RETIRADA' ? 'Disponível' : 'Saiu para Entrega',
  ];

  const getIdx = (status: string): number => {
    switch (status) {
      case 'PEDIDO_REALIZADO':                             return 0;
      case 'PAGAMENTO_PROCESSANDO':
      case 'PENDING_PAYMENT':
      case 'PROCESSING':                                   return 1;
      case 'APROVADO':
      case 'PAID':
      case 'PAGO':
      case 'EM_SEPARACAO':                                 return 2;
      case 'LIBERADO':
      case 'SAIU_ENTREGA':
      case 'ENTREGUE':
      case 'DISPONIVEL':                                   return 3;
      default:                                             return 0;
    }
  };

  const currentIdx = getIdx(statusAtual);
  const lineWidth = `${(currentIdx / (labels.length - 1)) * 75}%`;

  return (
    <div className="relative w-full py-2">
      {/* linha de fundo */}
      <div className="absolute top-6 left-[12.5%] right-[12.5%] h-1 bg-gray-200 z-0 rounded-full" />
      {/* linha de progresso */}
      <div
        className="absolute top-6 left-[12.5%] h-1 bg-green-600 z-0 transition-all duration-500 rounded-full"
        style={{ width: lineWidth }}
      />

      {/* passos */}
      <div className="flex justify-between relative z-10">
        {labels.map((label, i) => {
          const ativo = i <= currentIdx;

          return (
            <div key={label} className="flex flex-col items-center w-[25%]">
              <div
                className={
                  ativo
                    ? 'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 z-10 transition-all duration-300 bg-green-600 border-green-600 text-white'
                    : 'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 z-10 transition-all duration-300 bg-white border-gray-300 text-gray-400'
                }
              >
                {i < currentIdx ? '✓' : i + 1}
              </div>
              <span
                className={
                  ativo
                    ? 'text-[10px] sm:text-xs mt-2 text-center w-full px-0.5 leading-tight font-bold text-green-700'
                    : 'text-[10px] sm:text-xs mt-2 text-center w-full px-0.5 leading-tight font-medium text-gray-400'
                }
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

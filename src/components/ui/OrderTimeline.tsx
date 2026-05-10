export function OrderTimeline({ statusAtual, entregaTipo }: { statusAtual: string; entregaTipo?: string }) {
  // A lógica tem exatamente 4 etapas.
  const labels = [
    'Pedido Realizado',
    'Pagamento Confirmado',
    'Em Separação',
    entregaTipo === 'RETIRADA' ? 'Disponível' : 'Saiu para Entrega'
  ];

  // Mapeia o status do banco para um índice numérico
  const getIdx = (status: string) => {
    switch (status) {
      case 'PEDIDO_REALIZADO':
      case 'PAGAMENTO_PROCESSANDO':
        return 0;
      case 'APROVADO':
      case 'PAID':
        return 1;
      case 'EM_SEPARACAO':
        return 2;
      case 'LIBERADO':
        return 3;
      default:
        return 0; // fallback
    }
  };

  const currentIdx = getIdx(statusAtual);

  return (
    <div className="relative w-full py-2">
      {/* Linhas de conexão absolutas (atrás dos círculos) */}
      <div className="absolute top-6 left-[12.5%] right-[12.5%] h-1 bg-gray-200 z-0" />
      <div 
        className="absolute top-6 left-[12.5%] h-1 bg-green-600 z-0 transition-all duration-500" 
        style={{ width: `${(currentIdx / (labels.length - 1)) * 75}%` }} 
      />

      {/* Círculos e Textos */}
      <div className="flex justify-between relative z-10">
        {labels.map((label, i) => {
          const concluido = i <= currentIdx;
          const atual = i === currentIdx;
          return (
            <div key={label} className="flex flex-col items-center w-[25%]">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 bg-white z-10
                ${concluido ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 text-gray-400'}
                ${atual ? 'ring-2 ring-green-600 ring-offset-2' : ''}`}>
                {concluido ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] sm:text-xs mt-2 text-center w-full px-0.5 leading-tight ${atual || concluido ? 'font-bold text-gray-900' : 'text-gray-400 font-medium'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

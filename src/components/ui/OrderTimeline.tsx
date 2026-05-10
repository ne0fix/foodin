export function OrderTimeline({ statusAtual, entregaTipo }: { statusAtual: string; entregaTipo?: string }) {
  const labels = [
    'Pedido Realizado',
    'Pagamento Confirmado',
    'Em Separação',
    entregaTipo === 'RETIRADA' ? 'Disponível' : 'Saiu para Entrega'
  ];

  const getIdx = (status: string) => {
    switch (status) {
      case 'PEDIDO_REALIZADO':
      case 'PAGAMENTO_PROCESSANDO':
      case 'PENDING_PAYMENT':
      case 'PROCESSING':
        return 0;
      case 'APROVADO':
      case 'PAID':
      case 'PAGO':
        return 1;
      case 'EM_SEPARACAO':
        return 2;
      case 'LIBERADO':
      case 'SAIU_ENTREGA':
      case 'ENTREGUE':
      case 'DISPONIVEL':
        return 3;
      default:
        return 0;
    }
  };

  const currentIdx = getIdx(statusAtual);

  return (
    <div className="relative w-full py-2">
      {/* Linhas de conexão absolutas (atrás dos círculos) */}
      <div className="absolute top-6 left-[12.5%] right-[12.5%] h-1 bg-gray-200 z-0 rounded-full" />
      <div 
        className="absolute top-6 left-[12.5%] h-1 bg-green-600 z-0 transition-all duration-500 rounded-full" 
        style={{ width: `${(currentIdx / (labels.length - 1)) * 75}%` }} 
      />

      {/* Círculos e Textos */}
      <div className="flex justify-between relative z-10">
        {labels.map((label, i) => {
          const passado = i < currentIdx;
          const atual = i === currentIdx;
          const futuro = i > currentIdx;

          let circleClasses = "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 z-10 transition-colors duration-300 ";
          if (passado) {
            circleClasses += "bg-green-600 border-green-600 text-white";
          } else if (atual) {
            circleClasses += "bg-white border-green-600 text-green-600";
          } else {
            circleClasses += "bg-white border-gray-300 text-gray-400";
          }

          let textClasses = "text-[10px] sm:text-xs mt-2 text-center w-full px-0.5 leading-tight transition-colors duration-300 ";
          if (passado) {
            textClasses += "font-bold text-green-700";
          } else if (atual) {
            textClasses += "font-bold text-green-600";
          } else {
            textClasses += "font-medium text-gray-400";
          }

          return (
            <div key={label} className="flex flex-col items-center w-[25%]">
              <div className={circleClasses}>
                {passado ? '✓' : i + 1}
              </div>
              <span className={textClasses}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

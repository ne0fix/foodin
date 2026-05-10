const STATUS_MAP: Record<string, { label: string; cor: string }> = {
  PEDIDO_REALIZADO:      { label: 'Pedido realizado',       cor: 'bg-gray-100 text-gray-700' },
  PAGAMENTO_PROCESSANDO: { label: 'Pagamento em processo',  cor: 'bg-yellow-100 text-yellow-700' },
  APROVADO:              { label: 'Aprovado',               cor: 'bg-blue-100 text-blue-700' },
  EM_SEPARACAO:          { label: 'Em separação',           cor: 'bg-orange-100 text-orange-700' },
  LIBERADO:              { label: 'Liberado para entrega',  cor: 'bg-green-100 text-green-700' },
  CANCELADO:             { label: 'Cancelado',              cor: 'bg-red-100 text-red-700' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status] ?? { label: status, cor: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${config.cor}`}>
      {config.label}
    </span>
  );
}

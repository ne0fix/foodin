import Link from 'next/link';

export const metadata = {
  title: 'Termos e Condições | Super G & N',
  description: 'Termos e condições de uso do Supermercado Super G & N.',
};

export default function TermosPage() {
  return (
    <div className="container mx-auto px-4 max-w-3xl py-10 sm:py-16">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">Termos e Condições</h1>
      <p className="text-sm text-gray-400 mb-8">Última atualização: maio de 2026</p>

      <div className="space-y-8 text-gray-600 text-sm sm:text-base leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">1. Aceitação dos Termos</h2>
          <p>Ao utilizar o site do Super G & N, você concorda com estes termos. Se não concordar, não utilize nossos serviços.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">2. Produtos e Preços</h2>
          <p>Os preços e disponibilidade de produtos podem ser alterados sem aviso prévio. Nos reservamos o direito de cancelar pedidos em caso de erro de preço ou indisponibilidade de estoque.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">3. Pagamentos</h2>
          <p>Aceitamos pagamentos via PIX e cartão de crédito, processados pela plataforma Mercado Pago. O pedido só é confirmado após a confirmação do pagamento.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">4. Entregas</h2>
          <p>As entregas são realizadas na área de Pacatuba - CE e região. O prazo de entrega pode variar de acordo com a localização e disponibilidade. O frete é calculado no momento do checkout.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">5. Cancelamentos e Devoluções</h2>
          <p>Pedidos podem ser cancelados antes da saída para entrega. Para cancelamentos ou trocas, entre em contato pelo WhatsApp <strong>(85) 99113-5449</strong>.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">6. Responsabilidade</h2>
          <p>O Super G & N não se responsabiliza por problemas causados por informações incorretas fornecidas pelo cliente, como endereço errado.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">7. Contato</h2>
          <p>Dúvidas sobre estes termos? Fale conosco pelo WhatsApp: <strong>(85) 99113-5449</strong>.</p>
        </section>
      </div>

      <div className="mt-10">
        <Link href="/" className="text-green-600 font-semibold hover:underline text-sm">← Voltar para a loja</Link>
      </div>
    </div>
  );
}

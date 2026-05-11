import Link from 'next/link';

export const metadata = {
  title: 'Política de Privacidade | Super G & N',
  description: 'Política de privacidade do Supermercado Super G & N.',
};

export default function PoliticaPrivacidadePage() {
  return (
    <div className="container mx-auto px-4 max-w-3xl py-10 sm:py-16">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">Política de Privacidade</h1>
      <p className="text-sm text-gray-400 mb-8">Última atualização: maio de 2026</p>

      <div className="space-y-8 text-gray-600 text-sm sm:text-base leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">1. Dados que coletamos</h2>
          <p>Coletamos os dados que você fornece diretamente ao se cadastrar ou realizar compras: nome, CPF, telefone (WhatsApp) e endereço de entrega. Esses dados são necessários para identificação e entrega dos pedidos.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">2. Como usamos seus dados</h2>
          <p>Seus dados são utilizados exclusivamente para:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Processar e entregar seus pedidos</li>
            <li>Comunicar atualizações sobre seu pedido</li>
            <li>Garantir a segurança da sua conta</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">3. Compartilhamento de dados</h2>
          <p>Não compartilhamos seus dados pessoais com terceiros, exceto quando necessário para processar pagamentos (Mercado Pago) ou quando exigido por lei.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">4. Segurança</h2>
          <p>Seus dados são armazenados com segurança. As senhas e PINs são criptografados e nunca são armazenados em texto puro. Utilizamos HTTPS em todas as comunicações.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">5. Seus direitos</h2>
          <p>Você pode solicitar a qualquer momento a exclusão dos seus dados ou a correção de informações incorretas. Entre em contato pelo WhatsApp <strong>(85) 99113-5449</strong>.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">6. Contato</h2>
          <p>Dúvidas sobre esta política? Fale conosco pelo WhatsApp: <strong>(85) 99113-5449</strong>.</p>
        </section>
      </div>

      <div className="mt-10">
        <Link href="/" className="text-green-600 font-semibold hover:underline text-sm">← Voltar para a loja</Link>
      </div>
    </div>
  );
}

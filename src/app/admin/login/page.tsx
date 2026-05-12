'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, AlertCircle, Loader2, ShieldCheck, Printer } from 'lucide-react';
import { LoginSchema, LoginFormData } from '@/src/utils/validators';

function imprimirTeste() {
  const w = window.open('', '_blank', 'width=320,height=800');
  if (!w) return;
  const agora = new Date().toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  w.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Cupom TESTE</title>
  <style>
    @page { size: 80mm auto; margin: 4mm 3mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Courier New', Courier, monospace; font-size: 11px; width: 72mm; color: #000; line-height: 1.45; }
    .center   { text-align: center; }
    .right    { text-align: right; }
    .bold     { font-weight: bold; }
    .big      { font-size: 14px; font-weight: bold; }
    .small    { font-size: 9px; }
    .sep      { border-bottom: 1px dotted #000; margin: 5px 0; }
    .row      { display: flex; justify-content: space-between; align-items: baseline; }
    .indent   { padding-left: 8px; color: #333; }
    .item-nome{ font-weight: bold; margin-top: 5px; }
    .section-title { font-weight: bold; font-size: 10px; letter-spacing: 0.5px; margin-top: 6px; }
    .total-box { border: 1px solid #000; padding: 4px 6px; margin: 6px 0; }
    .total-valor { font-size: 15px; font-weight: bold; }
    .obs { font-size: 9px; color: #444; margin-top: 3px; font-style: italic; }
    .rodape { font-size: 9px; text-align: center; margin-top: 8px; color: #333; }
    @media print { body { width: 72mm; } }
  </style>
</head>
<body>
  <div class="center">
    <div class="big">SUPERMERCADO G&amp;N</div>
    <div class="small">CNPJ: 08.143.625/0001-14</div>
    <div class="small">Av. XVII, 404 - Sen. Carlos Jereissati</div>
    <div class="small">Pacatuba - CE &nbsp; CEP: 61800-000</div>
    <div class="small">Tel: (85) 99113-5449</div>
  </div>
  <div class="sep" style="margin-top:6px"></div>
  <div class="center bold" style="font-size:12px; letter-spacing:1px;">*** CUPOM DE TESTE ***</div>
  <div class="sep"></div>
  <div class="row"><span class="bold">Pedido Nº:</span><span class="bold">#TESTE001</span></div>
  <div class="row"><span>Data/Hora:</span><span>${agora}</span></div>
  <div class="sep"></div>
  <div class="section-title">DADOS DO CLIENTE</div>
  <div class="sep"></div>
  <div class="row"><span>Nome:</span><span>João Silva Teste</span></div>
  <div class="row"><span>CPF:</span><span>071.***.***-79</span></div>
  <div class="row"><span>Tel:</span><span>(85) 99113-5449</span></div>
  <div class="sep"></div>
  <div class="section-title">ITENS DO PEDIDO</div>
  <div class="sep"></div>
  <div class="item-nome">Arroz Branco 5kg</div>
  <div class="row"><span class="indent">2 x R$ 24,90</span><span>R$ 49,80</span></div>
  <div class="item-nome">Feijao Carioca 1kg</div>
  <div class="row"><span class="indent">1 x R$ 8,99</span><span>R$ 8,99</span></div>
  <div class="item-nome">Oleo de Soja 900ml</div>
  <div class="row"><span class="indent">3 x R$ 6,50</span><span>R$ 19,50</span></div>
  <div class="item-nome">Acucar Cristal 1kg</div>
  <div class="row"><span class="indent">2 x R$ 4,75</span><span>R$ 9,50</span></div>
  <div class="sep"></div>
  <div class="row"><span>Subtotal:</span><span>R$ 87,79</span></div>
  <div class="row"><span>Frete:</span><span>GRATIS</span></div>
  <div class="sep"></div>
  <div class="total-box">
    <div class="row">
      <span class="bold" style="font-size:13px;">TOTAL</span>
      <span class="total-valor">R$ 87,79</span>
    </div>
  </div>
  <div class="section-title">FORMA DE PAGAMENTO</div>
  <div class="sep"></div>
  <div class="row"><span>Metodo:</span><span class="bold">PIX</span></div>
  <div class="row"><span>Status Pag.:</span><span class="bold">PAGO</span></div>
  <div class="sep"></div>
  <div class="section-title">ENDERECO DE ENTREGA</div>
  <div class="sep"></div>
  <div>Rua das Flores, 123 - Apto 45</div>
  <div>Centro</div>
  <div>Pacatuba - CE &nbsp; CEP: 61800-000</div>
  <div class="sep" style="margin-top:8px"></div>
  <div class="rodape">
    <div>Obrigado pela preferencia!</div>
    <div>Volte sempre ao Supermercado G&amp;N</div>
    <div style="margin-top:4px;">www.digitalgen.vercel.app</div>
    <div style="margin-top:6px; font-size:8px;">Documento emitido em ${agora}</div>
  </div>
  <script>window.onload = function(){ window.print(); setTimeout(function(){ window.close(); }, 1000); };</script>
</body>
</html>`);
  w.document.close();
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Credenciais inválidas.');
      }
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conectar ao servidor.');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Painel esquerdo — visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Círculos decorativos */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -right-16 w-[500px] h-[500px] bg-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-green-500/10 rounded-full blur-2xl" />

        <div className="relative z-10">
          <Image src="/foodin.png" alt="foodin" width={160} height={76} style={{ height: 'auto' }} className="drop-shadow-lg" />
        </div>

        <div className="relative z-10 space-y-6">
          <blockquote className="text-white/90 text-2xl font-light leading-relaxed">
            "Gerencie seu supermercado com facilidade, controle e agilidade."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm">
              GN
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Painel Administrativo</p>
              <p className="text-green-300 text-xs">Super G & N · Pacatuba, CE</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-green-300 text-xs">
          <ShieldCheck size={14} />
          <span>Acesso restrito a administradores autorizados</span>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-8 relative">
        <button
          type="button"
          onClick={imprimirTeste}
          title="Testar impressão de cupom"
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 hover:shadow-sm transition-all"
        >
          <Printer size={17} />
        </button>
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image src="/foodin.png" alt="foodin" width={140} height={67} style={{ height: 'auto' }} />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Bem-vindo</h1>
            <p className="text-gray-500 mt-1">Entre com suas credenciais de administrador</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  {...register('email')}
                  placeholder="admin@exemplo.com"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  {...register('senha')}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                />
              </div>
              {errors.senha && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.senha.message}
                </p>
              )}
            </div>

            {/* Erro geral */}
            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-green-600/25 hover:shadow-green-600/40 hover:-translate-y-0.5"
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> Entrando...</>
              ) : (
                'Entrar no Painel'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            © {new Date().getFullYear()} Super G & N · Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
}

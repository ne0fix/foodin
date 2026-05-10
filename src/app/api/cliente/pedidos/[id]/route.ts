import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const clienteId = req.headers.get('X-Cliente-Id');
  if (!clienteId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;

  try {
    const p = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!p || p.clienteId !== clienteId) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      id: p.id,
      numero: p.id.slice(-8).toUpperCase(),
      statusCliente: p.statusCliente,
      total: parseFloat(p.total.toString()),
      subtotal: parseFloat(p.subtotal.toString()),
      frete: parseFloat(p.frete.toString()),
      metodoPagamento: p.metodoPagamento,
      entregaTipo: p.entregaTipo,
      endereco: {
        logradouro: p.logradouro,
        numero: p.numero,
        bairro: p.bairro,
        cidade: p.cidade,
        uf: p.uf,
        cep: p.cep,
      },
      mpQrCode: p.mpQrCode,
      mpQrCodeBase64: p.mpQrCodeBase64,
      criadoEm: p.criadoEm,
      pagoEm: p.pagoEm,
      items: p.items.map(item => ({
        id: item.id,
        nomeProduto: item.nomeProduto,
        imagemProduto: item.imagemProduto,
        quantidade: item.quantidade,
        preco: parseFloat(item.preco.toString()),
        subtotal: parseFloat(item.subtotal.toString()),
      })),
    });

  } catch (error) {
    console.error('Erro ao buscar detalhe do pedido:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}

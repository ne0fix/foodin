import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const categoria = await prisma.categoria.findFirst({ select: { id: true, nome: true } });
if (!categoria) { console.error('Nenhuma categoria encontrada'); process.exit(1); }

const produto = await prisma.produto.upsert({
  where: { id: 'produto-teste-pix-001' },
  update: { preco: 0.01, emEstoque: true, ativo: true },
  create: {
    id:              'produto-teste-pix-001',
    nome:            'Teste PIX Produção — R$ 0,01',
    descricao:       'Produto criado para validar integração PIX em produção.',
    preco:           0.01,
    imagem:          '/gn2.png',
    imagens:         [],
    quantidadePacote:'1 un',
    emEstoque:       true,
    ativo:           true,
    categoriaId:     categoria.id,
  },
});

console.log(`✅ Produto criado: ${produto.id}`);
console.log(`   Nome : ${produto.nome}`);
console.log(`   Preço: R$ ${produto.preco}`);
console.log(`   Cat  : ${categoria.nome}`);
await prisma.$disconnect();

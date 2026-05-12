import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { mockCategorias, mockProdutos } from '../src/mocks/produtos.mock';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  const adminPassword = process.env.ADMIN_SENHA_SEED;
  const adminEmail = process.env.ADMIN_EMAIL_SEED;

  if (!adminPassword || !adminEmail) {
    throw new Error('ADMIN_SENHA_SEED and ADMIN_EMAIL_SEED must be defined in .env');
  }
  const hashedPassword = await hash(adminPassword, 12);

  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: { senhaHash: hashedPassword },
    create: {
      email: adminEmail,
      nome: 'Admin',
      senhaHash: hashedPassword,
    },
  });
  console.log('Admin user created/updated.');

  // Remove dados antigos de supermercado (ordem: tags > produtos > categorias)
  const categoriasAntigas = [
    'hortifruti', 'frios-e-embutidos', 'congelados',
    'higiene-e-beleza', 'limpeza', 'pet-shop', 'utilidades',
  ];
  const produtosAntigos = await prisma.produto.findMany({
    where: { categoriaId: { in: categoriasAntigas } },
    select: { id: true },
  });
  const idsAntigos = produtosAntigos.map(p => p.id);
  if (idsAntigos.length > 0) {
    await prisma.produtoTag.deleteMany({ where: { produtoId: { in: idsAntigos } } });
    await prisma.produto.deleteMany({ where: { id: { in: idsAntigos } } });
  }
  for (const id of categoriasAntigas) {
    await prisma.categoria.deleteMany({ where: { id } });
  }

  for (const categoria of mockCategorias) {
    await prisma.categoria.upsert({
      where: { id: categoria.id },
      update: { nome: categoria.nome, icone: categoria.icone },
      create: {
        id: categoria.id,
        nome: categoria.nome,
        icone: categoria.icone,
      },
    });
  }
  console.log('Categories created/updated.');

  const tags = [
    'desconto', 'mais-pedido', 'novo', 'especial',
    'vegetariano', 'vegano', 'picante', 'sem-gluten',
  ];
  for (const tagLabel of tags) {
    await prisma.tag.upsert({
      where: { id: tagLabel },
      update: {},
      create: { id: tagLabel, label: tagLabel },
    });
  }
  // Remove tags antigas que não existem mais
  const tagsAntigas = ['fresco', 'organico', 'sem-lactose'];
  for (const tagLabel of tagsAntigas) {
    await prisma.tag.deleteMany({ where: { id: tagLabel } });
  }
  console.log('Tags created/updated.');

  for (const produto of mockProdutos) {
    const productData = {
      nome: produto.nome,
      descricao: produto.descricao,
      preco: produto.preco,
      precoOriginal: produto.precoOriginal,
      imagem: produto.imagem,
      quantidadePacote: produto.quantidadePacote,
      emEstoque: produto.emEstoque,
      avaliacao: produto.avaliacao,
      numAvaliacoes: produto.numAvaliacoes,
      categoriaId: produto.categoria,
    };

    const existingProduct = await prisma.produto.findFirst({
      where: { nome: productData.nome },
    });

    let upsertedProduto;
    if (existingProduct) {
      upsertedProduto = await prisma.produto.update({
        where: { id: existingProduct.id },
        data: productData,
      });
    } else {
      upsertedProduto = await prisma.produto.create({
        data: productData,
      });
    }

    if (produto.tags && produto.tags.length > 0) {
      await prisma.produtoTag.deleteMany({ where: { produtoId: upsertedProduto.id } });
      for (const tagLabel of produto.tags) {
        const tag = await prisma.tag.findUnique({ where: { id: tagLabel } });
        if (tag) {
          await prisma.produtoTag.create({
            data: { produtoId: upsertedProduto.id, tagId: tag.id },
          });
        }
      }
    }
  }
  console.log(`Products created/updated: ${mockProdutos.length}`);

  // Seções da home — food delivery
  const secoes = [
    {
      slug: 'mais-pedidos',
      titulo: '🔥 Mais Pedidos',
      subtitulo: 'Os pratos favoritos dos nossos clientes',
      ordem: 0,
      modoSelecao: 'AUTOMATICO' as const,
      filtroTag: 'mais-pedido',
      filtroCategoriaId: null,
      maxItens: 8,
    },
    {
      slug: 'hamburgueres',
      titulo: '🍔 Hambúrgueres',
      subtitulo: 'Artesanais, smash e muito mais',
      ordem: 1,
      modoSelecao: 'AUTOMATICO' as const,
      filtroTag: null,
      filtroCategoriaId: 'hamburguer',
      maxItens: 8,
    },
    {
      slug: 'pizzas',
      titulo: '🍕 Pizzas',
      subtitulo: 'Tradicionais, especiais e vegetarianas',
      ordem: 2,
      modoSelecao: 'AUTOMATICO' as const,
      filtroTag: null,
      filtroCategoriaId: 'pizza',
      maxItens: 8,
    },
    {
      slug: 'promocoes',
      titulo: '💸 Promoções',
      subtitulo: 'Aproveite os descontos de hoje',
      ordem: 3,
      modoSelecao: 'AUTOMATICO' as const,
      filtroTag: 'desconto',
      filtroCategoriaId: null,
      maxItens: 8,
    },
  ];

  // Remove seções antigas de supermercado
  await prisma.secao.deleteMany({ where: { slug: { in: ['ofertas-do-dia', 'frios-embutidos'] } } });

  for (const secao of secoes) {
    await prisma.secao.upsert({
      where: { slug: secao.slug },
      update: {
        titulo: secao.titulo,
        subtitulo: secao.subtitulo,
        ordem: secao.ordem,
        filtroTag: secao.filtroTag,
        filtroCategoriaId: secao.filtroCategoriaId,
        maxItens: secao.maxItens,
      },
      create: {
        slug: secao.slug,
        titulo: secao.titulo,
        subtitulo: secao.subtitulo,
        ordem: secao.ordem,
        modoSelecao: secao.modoSelecao,
        filtroTag: secao.filtroTag,
        filtroCategoriaId: secao.filtroCategoriaId,
        maxItens: secao.maxItens,
      },
    });
  }
  console.log('Home sections created/updated.');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/lib/prisma';
import { hashPassword } from '@/src/lib/password';
import { validarCPF } from '@/src/utils/validators';

const CadastroSchema = z.object({
  nome:           z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpf:            z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  whatsapp:       z.string().regex(/^\d{10,11}$/, 'WhatsApp inválido'),
  pin:            z.string().regex(/^\d{4}$/, 'PIN deve ter 4 dígitos'),
  pinConfirmacao: z.string().regex(/^\d{4}$/, 'PIN de confirmação deve ter 4 dígitos'),
  endereco: z.object({
    cep:        z.string().regex(/^\d{8}$/, 'CEP inválido'),
    logradouro: z.string().min(1, 'Logradouro é obrigatório'),
    numero:     z.string().min(1, 'Número é obrigatório'),
    complemento:z.string().optional().nullable(),
    referencia: z.string().optional().nullable(),
    bairro:     z.string().min(1, 'Bairro é obrigatório'),
    cidade:     z.string().min(1, 'Cidade é obrigatória'),
    uf:         z.string().length(2, 'UF deve ter 2 caracteres'),
  }),
}).refine(d => d.pin === d.pinConfirmacao, {
  message: 'PINs não coincidem',
  path: ['pinConfirmacao'],
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = CadastroSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { nome, cpf, whatsapp, pin, endereco } = validation.data;

    // 1. Validar algoritmo do CPF
    if (!validarCPF(cpf)) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
    }

    // 2. Checar unicidade
    const existe = await prisma.cliente.findUnique({
      where: { cpf },
    });

    if (existe) {
      return NextResponse.json({ error: 'CPF já cadastrado' }, { status: 409 });
    }

    // 3. Hash do PIN
    const pinHash = await hashPassword(pin);

    // 4. Criar Cliente + Endereco em transação
    const cliente = await prisma.$transaction(async (tx) => {
      const c = await tx.cliente.create({
        data: {
          nome,
          cpf,
          whatsapp,
          pinHash,
          enderecos: {
            create: {
              apelido: 'Casa',
              cep: endereco.cep,
              logradouro: endereco.logradouro,
              numero: endereco.numero,
              complemento: endereco.complemento,
              referencia: endereco.referencia,
              bairro: endereco.bairro,
              cidade: endereco.cidade,
              uf: endereco.uf,
              principal: true,
            }
          }
        }
      });
      return c;
    });

    return NextResponse.json({ 
      message: 'Cadastro realizado com sucesso', 
      clienteId: cliente.id 
    }, { status: 201 });

  } catch (error) {
    console.error('Erro no cadastro:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}

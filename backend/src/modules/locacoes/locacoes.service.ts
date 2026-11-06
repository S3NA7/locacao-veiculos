import type { Locacao, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { ErroHttp } from "../../lib/erro-http.js";
import { calcularValorTotal } from "./calcular-valor.js";
import type { DadosLocacao } from "./locacoes.schemas.js";

const inclusaoPadrao = {
  veiculo: { select: { id: true, placa: true, marca: true, modelo: true } },
  usuario: { select: { id: true, nome: true, email: true } }
} satisfies Prisma.LocacaoInclude;

type LocacaoCompleta = Prisma.LocacaoGetPayload<{ include: typeof inclusaoPadrao }>;

function serializarLocacao(locacao: LocacaoCompleta) {
  return {
    ...locacao,
    valorDiaria: Number(locacao.valorDiaria),
    valorTotal: locacao.valorTotal === null ? null : Number(locacao.valorTotal)
  };
}

function podeAcessar(usuario: UsuarioAutenticado, locacao: Locacao) {
  return usuario.perfil === "ADMIN" || locacao.usuarioId === usuario.id;
}

export async function listar(usuario: UsuarioAutenticado) {
  const locacoes = await prisma.locacao.findMany({
    where: usuario.perfil === "ADMIN" ? undefined : { usuarioId: usuario.id },
    include: inclusaoPadrao,
    orderBy: { id: "desc" }
  });
  return locacoes.map(serializarLocacao);
}

export async function criar(usuario: UsuarioAutenticado, dados: DadosLocacao) {
  const veiculo = await prisma.veiculo.findUnique({ where: { id: dados.veiculoId } });
  if (!veiculo) {
    throw new ErroHttp(404, "Veículo não encontrado");
  }

  const locacao = await prisma.$transaction(async (tx) => {
    const reserva = await tx.veiculo.updateMany({
      where: { id: veiculo.id, status: "DISPONIVEL" },
      data: { status: "ALUGADO" }
    });
    if (reserva.count === 0) {
      throw new ErroHttp(409, "Veículo indisponível");
    }

    return tx.locacao.create({
      data: {
        usuarioId: usuario.id,
        veiculoId: veiculo.id,
        dataPrevista: dados.dataPrevista,
        valorDiaria: veiculo.valorDiaria
      },
      include: inclusaoPadrao
    });
  });

  return serializarLocacao(locacao);
}

export async function devolver(usuario: UsuarioAutenticado, id: number) {
  const locacao = await prisma.locacao.findUnique({ where: { id } });
  if (!locacao) {
    throw new ErroHttp(404, "Locação não encontrada");
  }
  if (!podeAcessar(usuario, locacao)) {
    throw new ErroHttp(403, "Locação pertence a outro cliente");
  }
  if (locacao.dataDevolucao) {
    throw new ErroHttp(409, "Locação já devolvida");
  }

  const dataDevolucao = new Date();
  const valorTotal = calcularValorTotal(locacao.dataInicio, dataDevolucao, Number(locacao.valorDiaria));

  const [devolvida] = await prisma.$transaction([
    prisma.locacao.update({
      where: { id },
      data: { dataDevolucao, valorTotal },
      include: inclusaoPadrao
    }),
    prisma.veiculo.update({ where: { id: locacao.veiculoId }, data: { status: "DISPONIVEL" } })
  ]);

  return serializarLocacao(devolvida);
}

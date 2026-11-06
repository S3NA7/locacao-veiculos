import { Prisma, type Veiculo } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { ErroHttp } from "../../lib/erro-http.js";
import type { DadosAtualizacaoVeiculo, DadosVeiculo, FiltroVeiculos } from "./veiculos.schemas.js";

export function serializarVeiculo(veiculo: Veiculo) {
  return { ...veiculo, valorDiaria: Number(veiculo.valorDiaria) };
}

function placaDuplicada(erro: unknown) {
  return erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002";
}

function registroInexistente(erro: unknown) {
  return erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2025";
}

export async function listar(filtro: FiltroVeiculos) {
  const veiculos = await prisma.veiculo.findMany({
    where: filtro.status ? { status: filtro.status } : undefined,
    orderBy: { id: "asc" }
  });
  return veiculos.map(serializarVeiculo);
}

export async function buscar(id: number) {
  const veiculo = await prisma.veiculo.findUnique({ where: { id } });
  if (!veiculo) {
    throw new ErroHttp(404, "Veículo não encontrado");
  }
  return serializarVeiculo(veiculo);
}

export async function criar(dados: DadosVeiculo) {
  try {
    const veiculo = await prisma.veiculo.create({ data: dados });
    return serializarVeiculo(veiculo);
  } catch (erro) {
    if (placaDuplicada(erro)) {
      throw new ErroHttp(409, "Placa já cadastrada");
    }
    throw erro;
  }
}

export async function atualizar(id: number, dados: DadosAtualizacaoVeiculo) {
  try {
    const veiculo = await prisma.veiculo.update({ where: { id }, data: dados });
    return serializarVeiculo(veiculo);
  } catch (erro) {
    if (registroInexistente(erro)) {
      throw new ErroHttp(404, "Veículo não encontrado");
    }
    if (placaDuplicada(erro)) {
      throw new ErroHttp(409, "Placa já cadastrada");
    }
    throw erro;
  }
}

export async function remover(id: number) {
  await buscar(id);

  const locacaoAtiva = await prisma.locacao.findFirst({ where: { veiculoId: id, dataDevolucao: null } });
  if (locacaoAtiva) {
    throw new ErroHttp(409, "Veículo possui locação ativa");
  }

  await prisma.$transaction([
    prisma.locacao.deleteMany({ where: { veiculoId: id } }),
    prisma.veiculo.delete({ where: { id } })
  ]);
}

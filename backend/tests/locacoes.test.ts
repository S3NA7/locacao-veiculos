import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { criarApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { limparBanco } from "./setup.js";
import { criarAdmin, criarCliente, type UsuarioCriado } from "./helpers.js";

const app = criarApp();

let admin: UsuarioCriado;
let clienteA: UsuarioCriado;
let clienteB: UsuarioCriado;
let veiculoId: number;

function comToken(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function dataDaqui(dias: number) {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data.toISOString().slice(0, 10);
}

function alugar(token: string, dados: Record<string, unknown> = { veiculoId, dataPrevista: dataDaqui(3) }) {
  return request(app).post("/locacoes").set(comToken(token)).send(dados);
}

beforeEach(async () => {
  await limparBanco();
  admin = await criarAdmin(app);
  clienteA = await criarCliente(app, "A");
  clienteB = await criarCliente(app, "B");
  const veiculo = await prisma.veiculo.create({
    data: { placa: "ABC1D23", marca: "Fiat", modelo: "Argo", ano: 2022, valorDiaria: 120 }
  });
  veiculoId = veiculo.id;
});

describe("POST /locacoes", () => {
  it("cliente aluga veículo disponível e o veículo fica ALUGADO", async () => {
    const resposta = await alugar(clienteA.token);
    const veiculo = await prisma.veiculo.findUniqueOrThrow({ where: { id: veiculoId } });

    expect(resposta.status).toBe(201);
    expect(resposta.body).toMatchObject({
      veiculo: { id: veiculoId, placa: "ABC1D23" },
      usuario: { id: clienteA.id },
      valorDiaria: 120,
      valorTotal: null,
      dataDevolucao: null
    });
    expect(veiculo.status).toBe("ALUGADO");
  });

  it("recusa alugar veículo já alugado com 409", async () => {
    await alugar(clienteA.token);

    const resposta = await alugar(clienteB.token);

    expect(resposta.status).toBe(409);
    expect(resposta.body).toEqual({ erro: "Veículo indisponível" });
  });

  it("em pedidos simultâneos só um cliente consegue alugar", async () => {
    const respostas = await Promise.all([alugar(clienteA.token), alugar(clienteB.token)]);
    const status = respostas.map((r) => r.status).sort();

    expect(status).toEqual([201, 409]);
  });

  it("recusa data prevista no passado com 400", async () => {
    const resposta = await alugar(clienteA.token, { veiculoId, dataPrevista: dataDaqui(-1) });

    expect(resposta.status).toBe(400);
  });

  it("recusa data prevista inválida com 400", async () => {
    const resposta = await alugar(clienteA.token, { veiculoId, dataPrevista: "abc" });

    expect(resposta.status).toBe(400);
  });

  it("retorna 404 para veículo inexistente", async () => {
    const resposta = await alugar(clienteA.token, { veiculoId: 9999, dataPrevista: dataDaqui(3) });

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({ erro: "Veículo não encontrado" });
  });
});

describe("GET /locacoes", () => {
  it("cliente vê só as suas e admin vê todas", async () => {
    const outro = await prisma.veiculo.create({
      data: { placa: "DEF4E56", marca: "VW", modelo: "Polo", ano: 2023, valorDiaria: 150 }
    });
    await alugar(clienteA.token);
    await alugar(clienteB.token, { veiculoId: outro.id, dataPrevista: dataDaqui(2) });

    const deA = await request(app).get("/locacoes").set(comToken(clienteA.token));
    const doAdmin = await request(app).get("/locacoes").set(comToken(admin.token));

    expect(deA.body).toHaveLength(1);
    expect(deA.body[0].usuario.id).toBe(clienteA.id);
    expect(doAdmin.body).toHaveLength(2);
  });
});

describe("POST /locacoes/:id/devolucao", () => {
  it("recusa devolução por quem não é o dono com 403", async () => {
    const locacao = (await alugar(clienteA.token)).body;

    const resposta = await request(app).post(`/locacoes/${locacao.id}/devolucao`).set(comToken(clienteB.token));

    expect(resposta.status).toBe(403);
  });

  it("dono devolve, recebe valor total e veículo volta a DISPONIVEL", async () => {
    const locacao = (await alugar(clienteA.token)).body;

    const resposta = await request(app).post(`/locacoes/${locacao.id}/devolucao`).set(comToken(clienteA.token));
    const veiculo = await prisma.veiculo.findUniqueOrThrow({ where: { id: veiculoId } });

    expect(resposta.status).toBe(200);
    expect(resposta.body.valorTotal).toBe(120);
    expect(typeof resposta.body.dataDevolucao).toBe("string");
    expect(veiculo.status).toBe("DISPONIVEL");
  });

  it("recusa devolver duas vezes com 409", async () => {
    const locacao = (await alugar(clienteA.token)).body;
    await request(app).post(`/locacoes/${locacao.id}/devolucao`).set(comToken(clienteA.token));

    const resposta = await request(app).post(`/locacoes/${locacao.id}/devolucao`).set(comToken(clienteA.token));

    expect(resposta.status).toBe(409);
    expect(resposta.body).toEqual({ erro: "Locação já devolvida" });
  });

  it("admin pode devolver locação de qualquer cliente", async () => {
    const locacao = (await alugar(clienteA.token)).body;

    const resposta = await request(app).post(`/locacoes/${locacao.id}/devolucao`).set(comToken(admin.token));

    expect(resposta.status).toBe(200);
  });
});

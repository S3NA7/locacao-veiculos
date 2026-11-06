import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { criarApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { limparBanco } from "./setup.js";
import { criarAdmin, criarCliente, type UsuarioCriado } from "./helpers.js";

const app = criarApp();

const veiculoValido = { placa: "ABC1D23", marca: "Fiat", modelo: "Argo", ano: 2022, valorDiaria: 120 };

let admin: UsuarioCriado;
let cliente: UsuarioCriado;

beforeEach(async () => {
  await limparBanco();
  admin = await criarAdmin(app);
  cliente = await criarCliente(app);
});

function comToken(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function cadastrarVeiculo(dados = veiculoValido) {
  const resposta = await request(app).post("/veiculos").set(comToken(admin.token)).send(dados);
  return resposta.body;
}

describe("POST /veiculos", () => {
  it("recusa cliente com 403", async () => {
    const resposta = await request(app).post("/veiculos").set(comToken(cliente.token)).send(veiculoValido);

    expect(resposta.status).toBe(403);
    expect(resposta.body).toEqual({ erro: "Acesso restrito a administradores" });
  });

  it("permite admin cadastrar veículo disponível", async () => {
    const resposta = await request(app).post("/veiculos").set(comToken(admin.token)).send(veiculoValido);

    expect(resposta.status).toBe(201);
    expect(resposta.body).toMatchObject({ ...veiculoValido, status: "DISPONIVEL" });
    expect(typeof resposta.body.valorDiaria).toBe("number");
  });

  it("recusa placa duplicada com 409", async () => {
    await cadastrarVeiculo();

    const resposta = await request(app).post("/veiculos").set(comToken(admin.token)).send(veiculoValido);

    expect(resposta.status).toBe(409);
    expect(resposta.body).toEqual({ erro: "Placa já cadastrada" });
  });

  it("recusa placa fora do padrão com 400", async () => {
    const resposta = await request(app)
      .post("/veiculos")
      .set(comToken(admin.token))
      .send({ ...veiculoValido, placa: "abc" });

    expect(resposta.status).toBe(400);
  });
});

describe("GET /veiculos", () => {
  it("lista todos e filtra por status", async () => {
    const primeiro = await cadastrarVeiculo();
    await cadastrarVeiculo({ ...veiculoValido, placa: "DEF4E56" });
    await prisma.veiculo.update({ where: { id: primeiro.id }, data: { status: "ALUGADO" } });

    const todos = await request(app).get("/veiculos").set(comToken(cliente.token));
    const disponiveis = await request(app).get("/veiculos?status=DISPONIVEL").set(comToken(cliente.token));

    expect(todos.status).toBe(200);
    expect(todos.body).toHaveLength(2);
    expect(disponiveis.body).toHaveLength(1);
    expect(disponiveis.body[0].placa).toBe("DEF4E56");
  });

  it("retorna 404 para veículo inexistente", async () => {
    const resposta = await request(app).get("/veiculos/999").set(comToken(cliente.token));

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({ erro: "Veículo não encontrado" });
  });
});

describe("PUT e DELETE /veiculos/:id", () => {
  it("admin altera o valor da diária", async () => {
    const veiculo = await cadastrarVeiculo();

    const resposta = await request(app)
      .put(`/veiculos/${veiculo.id}`)
      .set(comToken(admin.token))
      .send({ valorDiaria: 199.9 });

    expect(resposta.status).toBe(200);
    expect(resposta.body.valorDiaria).toBe(199.9);
  });

  it("admin remove veículo e consulta posterior retorna 404", async () => {
    const veiculo = await cadastrarVeiculo();

    const remocao = await request(app).delete(`/veiculos/${veiculo.id}`).set(comToken(admin.token));
    const consulta = await request(app).get(`/veiculos/${veiculo.id}`).set(comToken(admin.token));

    expect(remocao.status).toBe(204);
    expect(consulta.status).toBe(404);
  });

  it("recusa remover veículo com locação ativa", async () => {
    const veiculo = await cadastrarVeiculo();
    await prisma.locacao.create({
      data: {
        usuarioId: cliente.id,
        veiculoId: veiculo.id,
        dataPrevista: new Date(),
        valorDiaria: 120
      }
    });

    const resposta = await request(app).delete(`/veiculos/${veiculo.id}`).set(comToken(admin.token));

    expect(resposta.status).toBe(409);
    expect(resposta.body).toEqual({ erro: "Veículo possui locação ativa" });
  });
});

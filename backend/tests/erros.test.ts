import { describe, expect, it } from "vitest";
import request from "supertest";
import { criarApp } from "../src/app.js";

const app = criarApp();

describe("respostas de erro sempre em JSON", () => {
  it("corpo JSON malformado retorna 400 com mensagem", async () => {
    const resposta = await request(app)
      .post("/auth/login")
      .set("Content-Type", "application/json")
      .send('{ "email": ');

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({ erro: "JSON inválido" });
  });

  it("rota inexistente retorna 404 em JSON", async () => {
    const resposta = await request(app).get("/nada");

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({ erro: "Rota não encontrada" });
  });
});

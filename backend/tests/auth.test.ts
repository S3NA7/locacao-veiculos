import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { criarApp } from "../src/app.js";
import { limparBanco } from "./setup.js";
import { criarAdmin, criarCliente } from "./helpers.js";

const app = criarApp();

beforeEach(limparBanco);

describe("POST /auth/registrar", () => {
  it("torna o primeiro usuário ADMIN e os seguintes CLIENTE", async () => {
    const primeiro = await request(app)
      .post("/auth/registrar")
      .send({ nome: "Ana", email: "ana@teste.com", senha: "senha123" });
    const segundo = await request(app)
      .post("/auth/registrar")
      .send({ nome: "Bia", email: "bia@teste.com", senha: "senha123" });

    expect(primeiro.status).toBe(201);
    expect(primeiro.body.perfil).toBe("ADMIN");
    expect(typeof primeiro.body.token).toBe("string");
    expect(segundo.status).toBe(201);
    expect(segundo.body.perfil).toBe("CLIENTE");
  });

  it("recusa email já cadastrado com 409", async () => {
    await criarAdmin(app);

    const resposta = await request(app)
      .post("/auth/registrar")
      .send({ nome: "Outro", email: "admin@teste.com", senha: "senha123" });

    expect(resposta.status).toBe(409);
    expect(resposta.body).toEqual({ erro: "Email já cadastrado" });
  });

  it("recusa senha com menos de 6 caracteres com 400", async () => {
    const resposta = await request(app)
      .post("/auth/registrar")
      .send({ nome: "Ana", email: "ana@teste.com", senha: "123" });

    expect(resposta.status).toBe(400);
    expect(typeof resposta.body.erro).toBe("string");
  });
});

describe("POST /auth/login", () => {
  it("retorna token e usuário com credenciais corretas", async () => {
    await criarAdmin(app);

    const resposta = await request(app)
      .post("/auth/login")
      .send({ email: "admin@teste.com", senha: "admin123" });

    expect(resposta.status).toBe(200);
    expect(typeof resposta.body.token).toBe("string");
    expect(resposta.body.usuario).toMatchObject({ email: "admin@teste.com", perfil: "ADMIN" });
  });

  it("recusa senha errada com 401", async () => {
    await criarAdmin(app);

    const resposta = await request(app)
      .post("/auth/login")
      .send({ email: "admin@teste.com", senha: "errada123" });

    expect(resposta.status).toBe(401);
    expect(resposta.body).toEqual({ erro: "Credenciais inválidas" });
  });
});

describe("GET /usuarios/eu", () => {
  it("recusa requisição sem token", async () => {
    const resposta = await request(app).get("/usuarios/eu");

    expect(resposta.status).toBe(401);
  });

  it("recusa token malformado", async () => {
    const resposta = await request(app).get("/usuarios/eu").set("Authorization", "Bearer abc");

    expect(resposta.status).toBe(401);
  });

  it("recusa token expirado", async () => {
    await criarAdmin(app);
    const cliente = await criarCliente(app);
    const expirado = jwt.sign({ sub: String(cliente.id), perfil: "CLIENTE" }, process.env.JWT_SECRET!, {
      expiresIn: -1
    });

    const resposta = await request(app).get("/usuarios/eu").set("Authorization", `Bearer ${expirado}`);

    expect(resposta.status).toBe(401);
  });

  it("retorna os dados do usuário logado", async () => {
    const admin = await criarAdmin(app);

    const resposta = await request(app).get("/usuarios/eu").set("Authorization", `Bearer ${admin.token}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({ id: admin.id, email: "admin@teste.com", perfil: "ADMIN" });
    expect(resposta.body.senhaHash).toBeUndefined();
  });
});

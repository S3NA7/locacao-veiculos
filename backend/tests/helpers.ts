import request from "supertest";
import type { Express } from "express";

export interface DadosCadastro {
  nome: string;
  email: string;
  senha: string;
}

export interface UsuarioCriado {
  id: number;
  perfil: "ADMIN" | "CLIENTE";
  token: string;
}

export async function criarUsuario(app: Express, dados: DadosCadastro): Promise<UsuarioCriado> {
  const resposta = await request(app).post("/auth/registrar").send(dados);
  if (resposta.status !== 201) {
    throw new Error(`Falha ao cadastrar usuário de teste: ${JSON.stringify(resposta.body)}`);
  }
  return { id: resposta.body.id, perfil: resposta.body.perfil, token: resposta.body.token };
}

export function criarAdmin(app: Express) {
  return criarUsuario(app, { nome: "Admin", email: "admin@teste.com", senha: "admin123" });
}

export function criarCliente(app: Express, sufixo = "") {
  return criarUsuario(app, { nome: `Cliente${sufixo}`, email: `cliente${sufixo}@teste.com`, senha: "cliente123" });
}

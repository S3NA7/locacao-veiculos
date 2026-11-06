import { api } from "./cliente";
import type { Sessao, Usuario } from "./tipos";

interface RespostaRegistro extends Usuario {
  token: string;
}

export async function registrar(nome: string, email: string, senha: string): Promise<Sessao> {
  const resposta = await api<RespostaRegistro>("/auth/registrar", {
    method: "POST",
    body: { nome, email, senha }
  });
  const { token, ...usuario } = resposta;
  return { token, usuario };
}

export function login(email: string, senha: string) {
  return api<Sessao>("/auth/login", { method: "POST", body: { email, senha } });
}

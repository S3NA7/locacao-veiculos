import { api } from "./cliente";
import type { Locacao } from "./tipos";

export function listarLocacoes(token: string) {
  return api<Locacao[]>("/locacoes", { token });
}

export function criarLocacao(token: string, dados: { veiculoId: number; dataPrevista: string }) {
  return api<Locacao>("/locacoes", { method: "POST", body: dados, token });
}

export function devolverLocacao(token: string, id: number) {
  return api<Locacao>(`/locacoes/${id}/devolucao`, { method: "POST", token });
}

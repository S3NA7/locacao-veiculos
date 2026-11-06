import { api } from "./cliente";
import type { DadosVeiculo, StatusVeiculo, Veiculo } from "./tipos";

export function listarVeiculos(token: string, status?: StatusVeiculo) {
  const consulta = status ? `?status=${status}` : "";
  return api<Veiculo[]>(`/veiculos${consulta}`, { token });
}

export function buscarVeiculo(token: string, id: number) {
  return api<Veiculo>(`/veiculos/${id}`, { token });
}

export function criarVeiculo(token: string, dados: DadosVeiculo) {
  return api<Veiculo>("/veiculos", { method: "POST", body: dados, token });
}

export function atualizarVeiculo(token: string, id: number, dados: DadosVeiculo) {
  return api<Veiculo>(`/veiculos/${id}`, { method: "PUT", body: dados, token });
}

export function removerVeiculo(token: string, id: number) {
  return api<void>(`/veiculos/${id}`, { method: "DELETE", token });
}

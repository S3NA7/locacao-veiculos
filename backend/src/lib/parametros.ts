import { ErroHttp } from "./erro-http.js";

export function lerIdDaRota(valor: string) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ErroHttp(400, "Identificador inválido");
  }
  return id;
}

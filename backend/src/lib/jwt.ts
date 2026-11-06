import jwt from "jsonwebtoken";
import type { Perfil } from "@prisma/client";

export interface PayloadToken {
  sub: number;
  perfil: Perfil;
}

function segredo() {
  const valor = process.env.JWT_SECRET;
  if (!valor) {
    throw new Error("JWT_SECRET não configurado");
  }
  return valor;
}

export function gerarToken(payload: PayloadToken) {
  return jwt.sign({ perfil: payload.perfil }, segredo(), { subject: String(payload.sub), expiresIn: "8h" });
}

export function verificarToken(token: string): PayloadToken {
  const decodificado = jwt.verify(token, segredo()) as jwt.JwtPayload;
  return { sub: Number(decodificado.sub), perfil: decodificado.perfil as Perfil };
}

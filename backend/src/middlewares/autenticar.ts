import type { NextFunction, Request, Response } from "express";
import { ErroHttp } from "../lib/erro-http.js";
import { verificarToken } from "../lib/jwt.js";

export function autenticar(req: Request, _res: Response, next: NextFunction) {
  const cabecalho = req.headers.authorization;
  const [esquema, token] = cabecalho?.split(" ") ?? [];

  if (esquema !== "Bearer" || !token) {
    next(new ErroHttp(401, "Token não informado"));
    return;
  }

  try {
    const payload = verificarToken(token);
    req.usuario = { id: payload.sub, perfil: payload.perfil };
    next();
  } catch {
    next(new ErroHttp(401, "Token inválido ou expirado"));
  }
}

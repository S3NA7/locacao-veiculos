import type { NextFunction, Request, Response } from "express";
import { ErroHttp } from "../lib/erro-http.js";

export function exigirAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.usuario?.perfil !== "ADMIN") {
    next(new ErroHttp(403, "Acesso restrito a administradores"));
    return;
  }
  next();
}

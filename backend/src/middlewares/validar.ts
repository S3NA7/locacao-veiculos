import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { ErroHttp } from "../lib/erro-http.js";

export function validar(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const resultado = schema.safeParse(req.body);
    if (!resultado.success) {
      const primeiro = resultado.error.issues[0];
      next(new ErroHttp(400, `${primeiro.path.join(".")}: ${primeiro.message}`.replace(/^: /, "")));
      return;
    }
    req.body = resultado.data;
    next();
  };
}

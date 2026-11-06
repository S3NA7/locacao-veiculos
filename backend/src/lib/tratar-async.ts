import type { NextFunction, Request, RequestHandler, Response } from "express";

type ManipuladorAsync = (req: Request, res: Response) => Promise<unknown>;

export function tratarAsync(manipulador: ManipuladorAsync): RequestHandler {
  return (req, res, next: NextFunction) => {
    manipulador(req, res).catch(next);
  };
}

import type { Request, Response } from "express";
import { lerIdDaRota } from "../../lib/parametros.js";
import { filtroVeiculosSchema } from "./veiculos.schemas.js";
import * as veiculosService from "./veiculos.service.js";

export async function listar(req: Request, res: Response) {
  const filtro = filtroVeiculosSchema.parse(req.query);
  res.json(await veiculosService.listar(filtro));
}

export async function buscar(req: Request, res: Response) {
  res.json(await veiculosService.buscar(lerIdDaRota(req.params.id)));
}

export async function criar(req: Request, res: Response) {
  res.status(201).json(await veiculosService.criar(req.body));
}

export async function atualizar(req: Request, res: Response) {
  res.json(await veiculosService.atualizar(lerIdDaRota(req.params.id), req.body));
}

export async function remover(req: Request, res: Response) {
  await veiculosService.remover(lerIdDaRota(req.params.id));
  res.status(204).end();
}

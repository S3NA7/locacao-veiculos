import type { Request, Response } from "express";
import { lerIdDaRota } from "../../lib/parametros.js";
import * as locacoesService from "./locacoes.service.js";

export async function listar(req: Request, res: Response) {
  res.json(await locacoesService.listar(req.usuario!));
}

export async function criar(req: Request, res: Response) {
  res.status(201).json(await locacoesService.criar(req.usuario!, req.body));
}

export async function devolver(req: Request, res: Response) {
  res.json(await locacoesService.devolver(req.usuario!, lerIdDaRota(req.params.id)));
}

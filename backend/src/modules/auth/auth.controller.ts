import type { Request, Response } from "express";
import * as authService from "./auth.service.js";

export async function registrar(req: Request, res: Response) {
  const resultado = await authService.registrar(req.body);
  res.status(201).json(resultado);
}

export async function login(req: Request, res: Response) {
  const resultado = await authService.login(req.body);
  res.json(resultado);
}

export async function eu(req: Request, res: Response) {
  const usuario = await authService.buscarPorId(req.usuario!.id);
  res.json(usuario);
}

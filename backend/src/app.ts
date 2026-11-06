import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { ZodError } from "zod";
import { ErroHttp } from "./lib/erro-http.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { usuariosRoutes } from "./modules/usuarios/usuarios.routes.js";
import { veiculosRoutes } from "./modules/veiculos/veiculos.routes.js";
import { locacoesRoutes } from "./modules/locacoes/locacoes.routes.js";

export function criarApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/saude", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/auth", authRoutes);
  app.use("/usuarios", usuariosRoutes);
  app.use("/veiculos", veiculosRoutes);
  app.use("/locacoes", locacoesRoutes);

  app.use((_req, res) => {
    res.status(404).json({ erro: "Rota não encontrada" });
  });

  app.use(tratarErro);

  return app;
}

function tratarErro(erro: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (erro instanceof ErroHttp) {
    res.status(erro.status).json({ erro: erro.message });
    return;
  }
  if (erro instanceof ZodError) {
    res.status(400).json({ erro: erro.issues[0]?.message ?? "Dados inválidos" });
    return;
  }
  if (erro instanceof SyntaxError && "status" in erro) {
    res.status(400).json({ erro: "JSON inválido" });
    return;
  }
  console.error(erro);
  res.status(500).json({ erro: "Erro interno do servidor" });
}

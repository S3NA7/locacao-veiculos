import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { ErroHttp } from "./lib/erro-http.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { usuariosRoutes } from "./modules/usuarios/usuarios.routes.js";

export function criarApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/saude", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/auth", authRoutes);
  app.use("/usuarios", usuariosRoutes);

  app.use(tratarErro);

  return app;
}

function tratarErro(erro: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (erro instanceof ErroHttp) {
    res.status(erro.status).json({ erro: erro.message });
    return;
  }
  console.error(erro);
  res.status(500).json({ erro: "Erro interno do servidor" });
}

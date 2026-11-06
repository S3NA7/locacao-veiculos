import { Router } from "express";
import { autenticar } from "../../middlewares/autenticar.js";
import { validar } from "../../middlewares/validar.js";
import { tratarAsync } from "../../lib/tratar-async.js";
import { criarLocacaoSchema } from "./locacoes.schemas.js";
import * as locacoesController from "./locacoes.controller.js";

export const locacoesRoutes = Router();

locacoesRoutes.use(autenticar);

locacoesRoutes.get("/", tratarAsync(locacoesController.listar));
locacoesRoutes.post("/", validar(criarLocacaoSchema), tratarAsync(locacoesController.criar));
locacoesRoutes.post("/:id/devolucao", tratarAsync(locacoesController.devolver));

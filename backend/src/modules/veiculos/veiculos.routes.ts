import { Router } from "express";
import { autenticar } from "../../middlewares/autenticar.js";
import { exigirAdmin } from "../../middlewares/exigir-admin.js";
import { validar } from "../../middlewares/validar.js";
import { tratarAsync } from "../../lib/tratar-async.js";
import { atualizarVeiculoSchema, veiculoSchema } from "./veiculos.schemas.js";
import * as veiculosController from "./veiculos.controller.js";

export const veiculosRoutes = Router();

veiculosRoutes.use(autenticar);

veiculosRoutes.get("/", tratarAsync(veiculosController.listar));
veiculosRoutes.get("/:id", tratarAsync(veiculosController.buscar));
veiculosRoutes.post("/", exigirAdmin, validar(veiculoSchema), tratarAsync(veiculosController.criar));
veiculosRoutes.put("/:id", exigirAdmin, validar(atualizarVeiculoSchema), tratarAsync(veiculosController.atualizar));
veiculosRoutes.delete("/:id", exigirAdmin, tratarAsync(veiculosController.remover));

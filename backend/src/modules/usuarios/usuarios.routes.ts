import { Router } from "express";
import { autenticar } from "../../middlewares/autenticar.js";
import { tratarAsync } from "../../lib/tratar-async.js";
import * as authController from "../auth/auth.controller.js";

export const usuariosRoutes = Router();

usuariosRoutes.get("/eu", autenticar, tratarAsync(authController.eu));

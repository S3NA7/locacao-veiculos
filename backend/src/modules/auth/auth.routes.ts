import { Router } from "express";
import { validar } from "../../middlewares/validar.js";
import { tratarAsync } from "../../lib/tratar-async.js";
import { loginSchema, registrarSchema } from "./auth.schemas.js";
import * as authController from "./auth.controller.js";

export const authRoutes = Router();

authRoutes.post("/registrar", validar(registrarSchema), tratarAsync(authController.registrar));
authRoutes.post("/login", validar(loginSchema), tratarAsync(authController.login));

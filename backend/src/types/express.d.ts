import type { Perfil } from "@prisma/client";

declare global {
  interface UsuarioAutenticado {
    id: number;
    perfil: Perfil;
  }

  namespace Express {
    interface Request {
      usuario?: UsuarioAutenticado;
    }
  }
}

export {};

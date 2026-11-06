import { z } from "zod";

export const registrarSchema = z.object({
  nome: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres"),
  email: z.string().trim().toLowerCase().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter ao menos 6 caracteres")
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
  senha: z.string().min(1, "Senha é obrigatória")
});

export type DadosRegistro = z.infer<typeof registrarSchema>;
export type DadosLogin = z.infer<typeof loginSchema>;

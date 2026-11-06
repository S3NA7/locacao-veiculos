import { z } from "zod";

const anoMaximo = new Date().getFullYear() + 1;

export const veiculoSchema = z.object({
  placa: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/, "Placa deve seguir o padrão ABC1D23"),
  marca: z.string().trim().min(1, "Marca é obrigatória"),
  modelo: z.string().trim().min(1, "Modelo é obrigatório"),
  ano: z.number().int().min(1950, "Ano mínimo é 1950").max(anoMaximo, `Ano máximo é ${anoMaximo}`),
  valorDiaria: z.number().positive("Valor da diária deve ser positivo")
});

export const atualizarVeiculoSchema = veiculoSchema.partial();

export const filtroVeiculosSchema = z.object({
  status: z.enum(["DISPONIVEL", "ALUGADO"]).optional()
});

export type DadosVeiculo = z.infer<typeof veiculoSchema>;
export type DadosAtualizacaoVeiculo = z.infer<typeof atualizarVeiculoSchema>;
export type FiltroVeiculos = z.infer<typeof filtroVeiculosSchema>;

import { z } from "zod";

function dataLocalComoIso(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function naoAnteriorAHoje(data: Date) {
  return data.toISOString().slice(0, 10) >= dataLocalComoIso(new Date());
}

export const criarLocacaoSchema = z.object({
  veiculoId: z.number().int().positive("Veículo inválido"),
  dataPrevista: z.coerce
    .date({ errorMap: () => ({ message: "Data prevista inválida" }) })
    .refine(naoAnteriorAHoje, "Data prevista não pode ser anterior a hoje")
});

export type DadosLocacao = z.infer<typeof criarLocacaoSchema>;

import { describe, expect, it } from "vitest";
import { calcularDias, calcularValorTotal } from "../src/modules/locacoes/calcular-valor.js";

describe("calcularDias", () => {
  it("cobra no mínimo 1 dia quando início e fim são iguais", () => {
    const data = new Date("2026-11-06T10:00:00Z");

    expect(calcularDias(data, data)).toBe(1);
  });

  it("arredonda para cima dias parciais", () => {
    const inicio = new Date("2026-11-06T10:00:00Z");
    const fim = new Date("2026-11-08T11:00:00Z");

    expect(calcularDias(inicio, fim)).toBe(3);
  });
});

describe("calcularValorTotal", () => {
  it("multiplica os dias pela diária", () => {
    const inicio = new Date("2026-11-06T10:00:00Z");
    const fim = new Date("2026-11-08T11:00:00Z");

    expect(calcularValorTotal(inicio, fim, 100)).toBe(300);
  });
});

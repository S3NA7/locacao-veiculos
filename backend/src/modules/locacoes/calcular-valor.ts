const milissegundosPorDia = 24 * 60 * 60 * 1000;

export function calcularDias(inicio: Date, fim: Date) {
  const decorrido = fim.getTime() - inicio.getTime();
  return Math.max(1, Math.ceil(decorrido / milissegundosPorDia));
}

export function calcularValorTotal(inicio: Date, fim: Date, valorDiaria: number) {
  const total = calcularDias(inicio, fim) * valorDiaria;
  return Math.round(total * 100) / 100;
}

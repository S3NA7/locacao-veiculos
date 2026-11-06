const formatadorMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

const formatadorDia = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

export function formatarMoeda(valor: number) {
  return formatadorMoeda.format(valor);
}

export function formatarDataHora(iso: string) {
  return formatadorDataHora.format(new Date(iso));
}

export function formatarDia(iso: string) {
  return formatadorDia.format(new Date(iso));
}

export function hojeComoIso() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

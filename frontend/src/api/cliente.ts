const urlBase = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export const eventoSessaoExpirada = "sessao-expirada";

interface OpcoesRequisicao {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  token?: string | null;
}

export async function api<T>(caminho: string, opcoes: OpcoesRequisicao = {}): Promise<T> {
  const cabecalhos: Record<string, string> = {};
  if (opcoes.body !== undefined) {
    cabecalhos["Content-Type"] = "application/json";
  }
  if (opcoes.token) {
    cabecalhos.Authorization = `Bearer ${opcoes.token}`;
  }

  const resposta = await fetch(`${urlBase}${caminho}`, {
    method: opcoes.method ?? "GET",
    headers: cabecalhos,
    body: opcoes.body === undefined ? undefined : JSON.stringify(opcoes.body)
  });

  if (resposta.status === 401 && opcoes.token) {
    window.dispatchEvent(new Event(eventoSessaoExpirada));
  }

  if (resposta.status === 204) {
    return undefined as T;
  }

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(dados.erro ?? "Falha ao comunicar com a API");
  }

  return dados as T;
}

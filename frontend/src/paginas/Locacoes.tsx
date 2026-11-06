import { useCallback, useEffect, useState } from "react";
import { devolverLocacao, listarLocacoes } from "../api/locacoes";
import type { Locacao } from "../api/tipos";
import { useAuth } from "../contexto/AuthContext";
import { formatarDataHora, formatarDia, formatarMoeda } from "../lib/formatar";

export function Locacoes() {
  const { token, usuario } = useAuth();
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [devolvendoId, setDevolvendoId] = useState<number | null>(null);

  const ehAdmin = usuario?.perfil === "ADMIN";
  const colunas = ehAdmin ? 8 : 7;

  const carregar = useCallback(async () => {
    if (!token) return;
    setErro("");
    setCarregando(true);
    try {
      setLocacoes(await listarLocacoes(token));
    } catch (falha) {
      setErro((falha as Error).message);
    } finally {
      setCarregando(false);
    }
  }, [token]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function devolver(locacao: Locacao) {
    if (!token) return;
    setErro("");
    setSucesso("");
    setDevolvendoId(locacao.id);
    try {
      const devolvida = await devolverLocacao(token, locacao.id);
      setSucesso(
        `Veículo ${devolvida.veiculo.placa} devolvido. Valor total: ${formatarMoeda(devolvida.valorTotal ?? 0)}`
      );
      await carregar();
    } catch (falha) {
      setErro((falha as Error).message);
    } finally {
      setDevolvendoId(null);
    }
  }

  return (
    <>
      <div className="barra-titulo">
        <h1>{ehAdmin ? "Todas as locações" : "Minhas locações"}</h1>
      </div>

      {erro && <p className="mensagem-erro">{erro}</p>}
      {sucesso && <p className="mensagem-sucesso">{sucesso}</p>}

      <div className="tabela-container">
        <table>
          <thead>
            <tr>
              <th>Veículo</th>
              {ehAdmin && <th>Cliente</th>}
              <th>Início</th>
              <th>Prevista</th>
              <th>Devolução</th>
              <th>Diária</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr>
                <td colSpan={colunas} className="vazio">
                  Carregando...
                </td>
              </tr>
            )}
            {!carregando && locacoes.length === 0 && (
              <tr>
                <td colSpan={colunas} className="vazio">
                  Nenhuma locação registrada
                </td>
              </tr>
            )}
            {!carregando &&
              locacoes.map((locacao) => (
                <tr key={locacao.id}>
                  <td>
                    <strong>{locacao.veiculo.placa}</strong> · {locacao.veiculo.marca} {locacao.veiculo.modelo}
                  </td>
                  {ehAdmin && <td>{locacao.usuario.nome}</td>}
                  <td>{formatarDataHora(locacao.dataInicio)}</td>
                  <td>{formatarDia(locacao.dataPrevista)}</td>
                  <td>
                    {locacao.dataDevolucao ? (
                      formatarDataHora(locacao.dataDevolucao)
                    ) : (
                      <span className="etiqueta etiqueta-alugado">Em andamento</span>
                    )}
                  </td>
                  <td>{formatarMoeda(locacao.valorDiaria)}</td>
                  <td>{locacao.valorTotal === null ? "—" : formatarMoeda(locacao.valorTotal)}</td>
                  <td>
                    <div className="acoes">
                      {!locacao.dataDevolucao && (
                        <button type="button" onClick={() => devolver(locacao)} disabled={devolvendoId === locacao.id}>
                          {devolvendoId === locacao.id ? "Devolvendo..." : "Devolver"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

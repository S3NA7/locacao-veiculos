import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listarVeiculos, removerVeiculo } from "../api/veiculos";
import { criarLocacao } from "../api/locacoes";
import type { Veiculo } from "../api/tipos";
import { useAuth } from "../contexto/AuthContext";
import { formatarMoeda } from "../lib/formatar";
import { DialogoAlugar } from "../componentes/DialogoAlugar";

export function Veiculos() {
  const { token, usuario } = useAuth();
  const navegar = useNavigate();
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [somenteDisponiveis, setSomenteDisponiveis] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [alugando, setAlugando] = useState<Veiculo | null>(null);

  const ehAdmin = usuario?.perfil === "ADMIN";

  const carregar = useCallback(async () => {
    if (!token) return;
    setErro("");
    setCarregando(true);
    try {
      setVeiculos(await listarVeiculos(token, somenteDisponiveis ? "DISPONIVEL" : undefined));
    } catch (falha) {
      setErro((falha as Error).message);
    } finally {
      setCarregando(false);
    }
  }, [token, somenteDisponiveis]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function excluir(veiculo: Veiculo) {
    if (!token || !confirm(`Excluir o veículo ${veiculo.placa}?`)) return;
    setErro("");
    try {
      await removerVeiculo(token, veiculo.id);
      await carregar();
    } catch (falha) {
      setErro((falha as Error).message);
    }
  }

  async function confirmarLocacao(dataPrevista: string) {
    if (!token || !alugando) return;
    await criarLocacao(token, { veiculoId: alugando.id, dataPrevista });
    navegar("/locacoes");
  }

  return (
    <>
      <div className="barra-titulo">
        <h1>Veículos</h1>
        <div className="barra-titulo">
          <label className="filtro">
            <input
              type="checkbox"
              checked={somenteDisponiveis}
              onChange={(e) => setSomenteDisponiveis(e.target.checked)}
            />
            Só disponíveis
          </label>
          {ehAdmin && (
            <Link to="/veiculos/novo">
              <button type="button">Novo veículo</button>
            </Link>
          )}
        </div>
      </div>

      {erro && <p className="mensagem-erro">{erro}</p>}

      <div className="tabela-container">
        <table>
          <thead>
            <tr>
              <th>Placa</th>
              <th>Veículo</th>
              <th>Ano</th>
              <th>Diária</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr>
                <td colSpan={6} className="vazio">
                  Carregando...
                </td>
              </tr>
            )}
            {!carregando && veiculos.length === 0 && (
              <tr>
                <td colSpan={6} className="vazio">
                  Nenhum veículo encontrado
                </td>
              </tr>
            )}
            {!carregando &&
              veiculos.map((veiculo) => (
                <tr key={veiculo.id}>
                  <td>
                    <strong>{veiculo.placa}</strong>
                  </td>
                  <td>
                    {veiculo.marca} {veiculo.modelo}
                  </td>
                  <td>{veiculo.ano}</td>
                  <td>{formatarMoeda(veiculo.valorDiaria)}</td>
                  <td>
                    <span className={`etiqueta etiqueta-${veiculo.status.toLowerCase()}`}>{veiculo.status}</span>
                  </td>
                  <td>
                    <div className="acoes">
                      {veiculo.status === "DISPONIVEL" && (
                        <button type="button" onClick={() => setAlugando(veiculo)}>
                          Alugar
                        </button>
                      )}
                      {ehAdmin && (
                        <>
                          <Link to={`/veiculos/${veiculo.id}/editar`}>
                            <button type="button" className="botao-secundario">
                              Editar
                            </button>
                          </Link>
                          <button type="button" className="botao-perigo" onClick={() => excluir(veiculo)}>
                            Excluir
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {alugando && (
        <DialogoAlugar veiculo={alugando} onConfirmar={confirmarLocacao} onCancelar={() => setAlugando(null)} />
      )}
    </>
  );
}

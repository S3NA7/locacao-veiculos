import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { atualizarVeiculo, buscarVeiculo, criarVeiculo } from "../api/veiculos";
import { useAuth } from "../contexto/AuthContext";

const anoAtual = new Date().getFullYear();

export function FormularioVeiculo() {
  const { token } = useAuth();
  const { id } = useParams();
  const navegar = useNavigate();
  const editando = id !== undefined;

  const [placa, setPlaca] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [ano, setAno] = useState(String(anoAtual));
  const [valorDiaria, setValorDiaria] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!token || !editando) return;
    buscarVeiculo(token, Number(id))
      .then((veiculo) => {
        setPlaca(veiculo.placa);
        setMarca(veiculo.marca);
        setModelo(veiculo.modelo);
        setAno(String(veiculo.ano));
        setValorDiaria(String(veiculo.valorDiaria));
      })
      .catch((falha) => setErro((falha as Error).message));
  }, [token, editando, id]);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!token) return;
    setErro("");
    setEnviando(true);
    const dados = { placa, marca, modelo, ano: Number(ano), valorDiaria: Number(valorDiaria) };
    try {
      if (editando) {
        await atualizarVeiculo(token, Number(id), dados);
      } else {
        await criarVeiculo(token, dados);
      }
      navegar("/veiculos");
    } catch (falha) {
      setErro((falha as Error).message);
      setEnviando(false);
    }
  }

  return (
    <form className="cartao formulario" style={{ maxWidth: 640 }} onSubmit={enviar}>
      <h1>{editando ? "Editar veículo" : "Novo veículo"}</h1>

      <div className="grade-formulario">
        <label>
          Placa
          <input
            value={placa}
            onChange={(e) => setPlaca(e.target.value.toUpperCase())}
            placeholder="ABC1D23"
            maxLength={7}
            required
            autoFocus
          />
        </label>

        <label>
          Ano
          <input
            type="number"
            value={ano}
            onChange={(e) => setAno(e.target.value)}
            min={1950}
            max={anoAtual + 1}
            required
          />
        </label>

        <label>
          Marca
          <input value={marca} onChange={(e) => setMarca(e.target.value)} required />
        </label>

        <label>
          Modelo
          <input value={modelo} onChange={(e) => setModelo(e.target.value)} required />
        </label>

        <label className="largura-total">
          Valor da diária (R$)
          <input
            type="number"
            value={valorDiaria}
            onChange={(e) => setValorDiaria(e.target.value)}
            min={1}
            step="0.01"
            required
          />
        </label>
      </div>

      {erro && <p className="mensagem-erro">{erro}</p>}

      <div className="dialogo-acoes">
        <button type="button" className="botao-secundario" onClick={() => navegar("/veiculos")}>
          Cancelar
        </button>
        <button type="submit" disabled={enviando}>
          {enviando ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}

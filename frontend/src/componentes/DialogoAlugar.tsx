import { useState, type FormEvent } from "react";
import type { Veiculo } from "../api/tipos";
import { formatarMoeda, hojeComoIso } from "../lib/formatar";

interface Props {
  veiculo: Veiculo;
  onConfirmar(dataPrevista: string): Promise<void>;
  onCancelar(): void;
}

export function DialogoAlugar({ veiculo, onConfirmar, onCancelar }: Props) {
  const [dataPrevista, setDataPrevista] = useState(hojeComoIso());
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function confirmar(evento: FormEvent) {
    evento.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      await onConfirmar(dataPrevista);
    } catch (falha) {
      setErro((falha as Error).message);
      setEnviando(false);
    }
  }

  return (
    <div className="sobreposicao" role="dialog" aria-modal="true">
      <form className="cartao dialogo" onSubmit={confirmar}>
        <h2>Alugar veículo</h2>
        <p className="subtitulo">
          {veiculo.marca} {veiculo.modelo} · {veiculo.placa} · {formatarMoeda(veiculo.valorDiaria)}/dia
        </p>

        <label>
          Data prevista de devolução
          <input
            type="date"
            value={dataPrevista}
            min={hojeComoIso()}
            onChange={(e) => setDataPrevista(e.target.value)}
            required
            autoFocus
          />
        </label>

        {erro && <p className="mensagem-erro">{erro}</p>}

        <div className="dialogo-acoes">
          <button type="button" className="botao-secundario" onClick={onCancelar} disabled={enviando}>
            Cancelar
          </button>
          <button type="submit" disabled={enviando}>
            {enviando ? "Alugando..." : "Confirmar"}
          </button>
        </div>
      </form>
    </div>
  );
}

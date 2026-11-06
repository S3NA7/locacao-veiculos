import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexto/AuthContext";

export function Login() {
  const { entrar } = useAuth();
  const navegar = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      await entrar(email, senha);
      navegar("/veiculos");
    } catch (falha) {
      setErro((falha as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="tela-centralizada">
      <form className="cartao formulario" onSubmit={enviar}>
        <h1>Locadora</h1>
        <p className="subtitulo">Entre para gerenciar veículos e locações</p>

        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>

        <label>
          Senha
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        </label>

        {erro && <p className="mensagem-erro">{erro}</p>}

        <button type="submit" disabled={enviando}>
          {enviando ? "Entrando..." : "Entrar"}
        </button>

        <p className="rodape-formulario">
          Não tem conta? <Link to="/cadastro">Cadastre-se</Link>
        </p>
      </form>
    </main>
  );
}

import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexto/AuthContext";

export function Cadastro() {
  const { cadastrar } = useAuth();
  const navegar = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      await cadastrar(nome, email, senha);
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
        <h1>Criar conta</h1>
        <p className="subtitulo">Cadastre-se para alugar veículos</p>

        <label>
          Nome
          <input value={nome} onChange={(e) => setNome(e.target.value)} required minLength={2} autoFocus />
        </label>

        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>

        <label>
          Senha
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} />
        </label>

        {erro && <p className="mensagem-erro">{erro}</p>}

        <button type="submit" disabled={enviando}>
          {enviando ? "Cadastrando..." : "Cadastrar"}
        </button>

        <p className="rodape-formulario">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </main>
  );
}

import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexto/AuthContext";

export function Layout() {
  const { usuario, sair } = useAuth();
  const navegar = useNavigate();

  function encerrarSessao() {
    sair();
    navegar("/login");
  }

  return (
    <div className="aplicacao">
      <header className="cabecalho">
        <div className="cabecalho-conteudo">
          <span className="marca">Locadora</span>
          <nav className="navegacao">
            <NavLink to="/veiculos">Veículos</NavLink>
            <NavLink to="/locacoes">Locações</NavLink>
          </nav>
          <div className="usuario-logado">
            <span className="nome-usuario">{usuario?.nome}</span>
            <span className={`etiqueta etiqueta-${usuario?.perfil.toLowerCase()}`}>{usuario?.perfil}</span>
            <button type="button" className="botao-secundario" onClick={encerrarSessao}>
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="conteudo">
        <Outlet />
      </main>
    </div>
  );
}

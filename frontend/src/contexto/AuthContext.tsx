import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as authApi from "../api/auth";
import { eventoSessaoExpirada } from "../api/cliente";
import type { Sessao, Usuario } from "../api/tipos";

const chaveSessao = "locadora.sessao";

interface ValorAuth {
  usuario: Usuario | null;
  token: string | null;
  entrar(email: string, senha: string): Promise<void>;
  cadastrar(nome: string, email: string, senha: string): Promise<void>;
  sair(): void;
}

const AuthContext = createContext<ValorAuth | null>(null);

function lerSessaoSalva(): Sessao | null {
  try {
    const salvo = localStorage.getItem(chaveSessao);
    return salvo ? (JSON.parse(salvo) as Sessao) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(lerSessaoSalva);

  const salvarSessao = useCallback((nova: Sessao) => {
    localStorage.setItem(chaveSessao, JSON.stringify(nova));
    setSessao(nova);
  }, []);

  const sair = useCallback(() => {
    localStorage.removeItem(chaveSessao);
    setSessao(null);
  }, []);

  useEffect(() => {
    window.addEventListener(eventoSessaoExpirada, sair);
    return () => window.removeEventListener(eventoSessaoExpirada, sair);
  }, [sair]);

  const valor = useMemo<ValorAuth>(
    () => ({
      usuario: sessao?.usuario ?? null,
      token: sessao?.token ?? null,
      async entrar(email, senha) {
        salvarSessao(await authApi.login(email, senha));
      },
      async cadastrar(nome, email, senha) {
        salvarSessao(await authApi.registrar(nome, email, senha));
      },
      sair
    }),
    [sessao, salvarSessao, sair]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const valor = useContext(AuthContext);
  if (!valor) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return valor;
}

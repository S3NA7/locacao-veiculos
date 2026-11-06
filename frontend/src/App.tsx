import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexto/AuthContext";
import { Layout } from "./componentes/Layout";
import { RotaProtegida } from "./componentes/RotaProtegida";
import { Login } from "./paginas/Login";
import { Cadastro } from "./paginas/Cadastro";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route element={<RotaProtegida />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/veiculos" replace />} />
              <Route path="/veiculos" element={<p>Veículos</p>} />
              <Route path="/locacoes" element={<p>Locações</p>} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

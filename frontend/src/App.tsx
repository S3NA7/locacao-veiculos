import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexto/AuthContext";
import { Layout } from "./componentes/Layout";
import { RotaProtegida } from "./componentes/RotaProtegida";
import { Login } from "./paginas/Login";
import { Cadastro } from "./paginas/Cadastro";
import { Veiculos } from "./paginas/Veiculos";
import { FormularioVeiculo } from "./paginas/FormularioVeiculo";

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
              <Route path="/veiculos" element={<Veiculos />} />
              <Route path="/veiculos/novo" element={<FormularioVeiculo />} />
              <Route path="/veiculos/:id/editar" element={<FormularioVeiculo />} />
              <Route path="/locacoes" element={<p>Locações</p>} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

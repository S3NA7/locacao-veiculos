import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexto/AuthContext";

export function RotaProtegida() {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

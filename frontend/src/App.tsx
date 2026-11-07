import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminShell } from "./components/admin/AdminShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicOnlyRoute } from "./components/PublicOnlyRoute";
import { AuthProvider } from "./context/AuthContext";
import { CarritoProvider } from "./context/CarritoContext";
import { AdminDashboardView } from "./pages/admin/AdminDashboardView";
import { MateriasPrimasAdminView } from "./pages/admin/MateriasPrimasAdminView";
import { ProduccionAdminView } from "./pages/admin/ProduccionAdminView";
import { RecetasBOMAdminView } from "./pages/admin/RecetasBOMAdminView";
import { ClienteMenuView } from "./pages/cliente/ClienteMenuView";
import { MisPedidosView } from "./pages/cliente/MisPedidosView";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RecepcionPedidosView } from "./pages/recepcion/RecepcionPedidosView";
import { RegisterPage } from "./pages/RegisterPage";
import { UnauthorizedPage } from "./pages/UnauthorizedPage";

export default function App() {
  return (
    <AuthProvider>
      <CarritoProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route element={<ProtectedRoute roles={["Cliente"]} />}>
              <Route path="/menu" element={<ClienteMenuView />} />
              <Route path="/mis-pedidos" element={<MisPedidosView />} />
            </Route>

            <Route
              element={
                <ProtectedRoute roles={["Administrador", "Recepcionista"]} />
              }
            >
              <Route path="/recepcion" element={<RecepcionPedidosView />} />
            </Route>

            <Route element={<ProtectedRoute roles={["Administrador"]} />}>
              <Route path="/admin" element={<AdminShell />}>
                <Route index element={<AdminDashboardView />} />
                <Route
                  path="materias-primas"
                  element={<MateriasPrimasAdminView />}
                />
                <Route path="recetas" element={<RecetasBOMAdminView />} />
                <Route path="produccion" element={<ProduccionAdminView />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CarritoProvider>
    </AuthProvider>
  );
}

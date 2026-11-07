import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicOnlyRoute } from "./components/PublicOnlyRoute";
import { AuthProvider } from "./context/AuthContext";
import { AdminPage } from "./pages/AdminPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { MenuPage } from "./pages/MenuPage";
import { MisPedidosPage } from "./pages/MisPedidosPage";
import { RegisterPage } from "./pages/RegisterPage";
import { UnauthorizedPage } from "./pages/UnauthorizedPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={["Cliente"]} />}>
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/mis-pedidos" element={<MisPedidosPage />} />
          </Route>

          <Route
            element={
              <ProtectedRoute roles={["Administrador", "Recepcionista"]} />
            }
          >
            <Route path="/admin" element={<AdminPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

import { Router } from "express";
import {
  actualizarEstadoPedido,
  crearPedido,
  crearPedidoAsistido,
  listarMisPedidos,
  listarPedidos,
} from "../controllers/pedidosController";
import { requerirRol, verificarToken } from "../middlewares/authMiddleware";

const router = Router();

router.use(verificarToken);

router.post("/", requerirRol("Cliente"), crearPedido);
router.post(
  "/asistido",
  requerirRol("Recepcionista", "Administrador"),
  crearPedidoAsistido
);
router.get("/mis-pedidos", requerirRol("Cliente"), listarMisPedidos);
router.get(
  "/",
  requerirRol("Recepcionista", "Administrador"),
  listarPedidos
);
router.put(
  "/:id/estado",
  requerirRol("Recepcionista", "Administrador"),
  actualizarEstadoPedido
);

export default router;

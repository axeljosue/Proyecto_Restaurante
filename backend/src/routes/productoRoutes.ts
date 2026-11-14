import { Router } from "express";
import {
  actualizarProducto,
  crearProducto,
  eliminarProducto,
  listarProductos,
  obtenerProducto,
} from "../controllers/productoController";
import { requerirRol, verificarToken } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", listarProductos);
router.get("/:id", obtenerProducto);
router.post(
  "/",
  verificarToken,
  requerirRol("Administrador"),
  crearProducto
);
router.put(
  "/:id",
  verificarToken,
  requerirRol("Administrador"),
  actualizarProducto
);
router.delete(
  "/:id",
  verificarToken,
  requerirRol("Administrador"),
  eliminarProducto
);

export default router;

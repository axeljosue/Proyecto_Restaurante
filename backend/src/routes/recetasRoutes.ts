import { Router } from "express";
import {
  guardarReceta,
  obtenerRecetaPorProducto,
} from "../controllers/recetasController";
import { requerirRol, verificarToken } from "../middlewares/authMiddleware";

const router = Router();

router.get("/:producto_id", obtenerRecetaPorProducto);
router.post("/", verificarToken, requerirRol("Administrador"), guardarReceta);

export default router;

import { Router } from "express";
import {
  actualizarStock,
  crearMateriaPrima,
  listarMateriasPrimas,
} from "../controllers/materiasPrimasController";
import { requerirRol, verificarToken } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", listarMateriasPrimas);
router.post(
  "/",
  verificarToken,
  requerirRol("Administrador"),
  crearMateriaPrima
);
router.put(
  "/:id/stock",
  verificarToken,
  requerirRol("Administrador"),
  actualizarStock
);

export default router;

import { Router } from "express";
import {
  mrpCheck,
  obtenerPronostico,
  registrarProduccion,
} from "../controllers/produccionController";
import { requerirRol, verificarToken } from "../middlewares/authMiddleware";

const router = Router();

router.use(verificarToken, requerirRol("Administrador"));

router.get("/mrp-check", mrpCheck);
router.get("/pronostico", obtenerPronostico);
router.post("/", registrarProduccion);

export default router;

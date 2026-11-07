import { Router } from "express";
import { listarProductos } from "../controllers/productoController";

const router = Router();

router.get("/", listarProductos);

export default router;

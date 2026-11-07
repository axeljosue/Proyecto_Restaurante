import cors from "cors";
import express from "express";
import { pool } from "./config/db";
import authRoutes from "./routes/authRoutes";
import categoriaRoutes from "./routes/categoriaRoutes";
import productoRoutes from "./routes/productoRoutes";

const app = express();

app.use(cors());
app.use(express.json());

const api = express.Router();

api.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT NOW()");
    res.json({
      success: true,
      data: { status: "ok", db: "conectada" },
    });
  } catch (error) {
    console.error("Error en health check", error);
    res.status(503).json({
      success: false,
      data: { status: "error", db: "desconectada" },
      message: "No se pudo conectar a la base de datos",
    });
  }
});

api.use("/auth", authRoutes);
api.use("/categorias", categoriaRoutes);
api.use("/productos", productoRoutes);

app.use("/api/v1", api);

export default app;

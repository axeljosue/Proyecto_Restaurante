import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/v1/health", (_req, res) => {
  res.json({
    success: true,
    data: { status: "ok" },
    message: "El Buen Sabor API",
  });
});

app.listen(port, () => {
  console.log(`API escuchando en el puerto ${port}`);
});

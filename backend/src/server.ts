import app from "./app";
import { testConnection } from "./config/db";

const port = Number(process.env.PORT) || 4000;

async function start(): Promise<void> {
  try {
    await testConnection();
    app.listen(port, () => {
      console.log(`API escuchando en el puerto ${port}`);
    });
  } catch (error) {
    console.error("No se pudo conectar a PostgreSQL", error);
    process.exit(1);
  }
}

void start();

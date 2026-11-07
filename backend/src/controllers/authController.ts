import type { Request, Response } from "express";
import { pool } from "../config/db";
import {
  comparePassword,
  generateToken,
  hashPassword,
  type JwtPayload,
} from "../utils/auth";

interface RegisterBody {
  nombre?: string;
  email?: string;
  password?: string;
  telefono?: string;
}

interface LoginBody {
  email?: string;
  password?: string;
}

interface UsuarioAuthRow {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  activo: boolean;
  password_hash: string;
  rol_id: number;
  rol_nombre: string;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function toAuthUser(row: UsuarioAuthRow) {
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    telefono: row.telefono,
    rol_id: row.rol_id,
    rol_nombre: row.rol_nombre,
  };
}

function toTokenPayload(row: UsuarioAuthRow): JwtPayload {
  return {
    id: row.id,
    email: row.email,
    rol_id: row.rol_id,
    rol_nombre: row.rol_nombre,
  };
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { nombre, email, password, telefono } = req.body as RegisterBody;

    if (
      !isNonEmptyString(nombre) ||
      !isNonEmptyString(email) ||
      !isNonEmptyString(password)
    ) {
      res.status(400).json({
        success: false,
        data: null,
        message: "nombre, email y password son obligatorios",
      });
      return;
    }

    const emailNormalizado = email.trim().toLowerCase();

    const emailExistente = await pool.query(
      "SELECT id FROM usuarios WHERE email = $1",
      [emailNormalizado]
    );

    if ((emailExistente.rowCount ?? 0) > 0) {
      res.status(409).json({
        success: false,
        data: null,
        message: "El email ya está registrado",
      });
      return;
    }

    const rolCliente = await pool.query<{ id: number }>(
      "SELECT id FROM roles WHERE nombre = $1",
      ["Cliente"]
    );

    if ((rolCliente.rowCount ?? 0) === 0) {
      res.status(500).json({
        success: false,
        data: null,
        message: "Rol Cliente no configurado en la base de datos",
      });
      return;
    }

    const passwordHash = await hashPassword(password);
    const telefonoNormalizado =
      typeof telefono === "string" && telefono.trim().length > 0
        ? telefono.trim()
        : null;

    const insertResult = await pool.query<UsuarioAuthRow>(
      `INSERT INTO usuarios (rol_id, nombre, email, password_hash, telefono)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING
         id,
         nombre,
         email,
         telefono,
         activo,
         password_hash,
         rol_id,
         'Cliente' AS rol_nombre`,
      [
        rolCliente.rows[0].id,
        nombre.trim(),
        emailNormalizado,
        passwordHash,
        telefonoNormalizado,
      ]
    );

    const usuario = insertResult.rows[0];
    const token = generateToken(toTokenPayload(usuario));

    res.status(201).json({
      success: true,
      data: {
        token,
        usuario: toAuthUser(usuario),
      },
      message: "Cliente registrado correctamente",
    });
  } catch (error) {
    console.error("Error en register", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "No se pudo registrar el usuario",
    });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as LoginBody;

    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      res.status(400).json({
        success: false,
        data: null,
        message: "email y password son obligatorios",
      });
      return;
    }

    const emailNormalizado = email.trim().toLowerCase();

    const result = await pool.query<UsuarioAuthRow>(
      `SELECT
         u.id,
         u.nombre,
         u.email,
         u.telefono,
         u.activo,
         u.password_hash,
         u.rol_id,
         r.nombre AS rol_nombre
       FROM usuarios u
       INNER JOIN roles r ON r.id = u.rol_id
       WHERE u.email = $1`,
      [emailNormalizado]
    );

    if ((result.rowCount ?? 0) === 0) {
      res.status(401).json({
        success: false,
        data: null,
        message: "Credenciales inválidas",
      });
      return;
    }

    const usuario = result.rows[0];

    if (!usuario.activo) {
      res.status(403).json({
        success: false,
        data: null,
        message: "Usuario inactivo",
      });
      return;
    }

    const passwordOk = await comparePassword(password, usuario.password_hash);

    if (!passwordOk) {
      res.status(401).json({
        success: false,
        data: null,
        message: "Credenciales inválidas",
      });
      return;
    }

    const token = generateToken(toTokenPayload(usuario));

    res.json({
      success: true,
      data: {
        token,
        usuario: toAuthUser(usuario),
      },
      message: "Inicio de sesión exitoso",
    });
  } catch (error) {
    console.error("Error en login", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "No se pudo iniciar sesión",
    });
  }
}

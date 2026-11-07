import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/auth";

export function verificarToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        data: null,
        message: "Token de autenticación requerido",
      });
      return;
    }

    const token = authHeader.slice("Bearer ".length).trim();

    if (!token) {
      res.status(401).json({
        success: false,
        data: null,
        message: "Token de autenticación requerido",
      });
      return;
    }

    req.user = verifyToken(token);
    next();
  } catch (error) {
    console.error("Error al verificar token", error);
    res.status(401).json({
      success: false,
      data: null,
      message: "Token inválido o expirado",
    });
  }
}

export function requerirRol(...rolesPermitidos: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        data: null,
        message: "No autenticado",
      });
      return;
    }

    if (!rolesPermitidos.includes(req.user.rol_nombre)) {
      res.status(403).json({
        success: false,
        data: null,
        message: "No tienes permisos para acceder a este recurso",
      });
      return;
    }

    next();
  };
}

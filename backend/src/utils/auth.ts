import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";

export interface JwtPayload {
  id: number;
  email: string;
  rol_id: number;
  rol_nombre: string;
}

const SALT_ROUNDS = 10;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error("JWT_SECRET no está configurado");
  }
  return secret;
}

function getJwtExpiresIn(): SignOptions["expiresIn"] {
  return (process.env.JWT_EXPIRES_IN?.trim() || "24h") as SignOptions["expiresIn"];
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: getJwtExpiresIn(),
  });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, getJwtSecret());

  if (typeof decoded !== "object" || decoded === null) {
    throw new Error("Token inválido");
  }

  const { id, email, rol_id, rol_nombre } = decoded as Partial<JwtPayload>;

  if (
    typeof id !== "number" ||
    typeof email !== "string" ||
    typeof rol_id !== "number" ||
    typeof rol_nombre !== "string"
  ) {
    throw new Error("Token con payload incompleto");
  }

  return { id, email, rol_id, rol_nombre };
}

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../db.js";
import config from "../config.js";
import { AppError } from "../utils/errors.js";

export async function register({ email, name, password }) {
  if (!email || !name || !password) {
    throw new AppError("email, name y password son requeridos", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    throw new AppError("Formato de email inválido", 400);
  }

  if (password.length < 6) {
    throw new AppError("La contraseña debe tener al menos 6 caracteres", 400);
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw new AppError("El email ya está registrado", 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email: normalizedEmail, name: name.trim(), passwordHash },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  const token = signToken(user);
  return { user, token };
}

export async function login({ email, password }) {
  if (!email || !password) {
    throw new AppError("email y password son requeridos", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    throw new AppError("Credenciales inválidas", 401);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError("Credenciales inválidas", 401);
  }

  const token = signToken(user);
  return {
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
    token,
  };
}

export async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  if (!user) {
    throw new AppError("Usuario no encontrado", 404);
  }

  return user;
}

function signToken(user) {
  return jwt.sign({ email: user.email }, config.jwtSecret, {
    subject: user.id,
    expiresIn: config.jwtExpiresIn,
  });
}

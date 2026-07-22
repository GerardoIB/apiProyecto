import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import config from "../config.js";
import prisma from "../db.js";
import { AppError } from "../utils/errors.js";

export function authJwt(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError("Token no proporcionado", 401));
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(new AppError("Token inválido o expirado", 401));
  }
}

export async function authDevice(req, _res, next) {
  const token = req.headers["x-device-token"];
  if (!token) {
    return next(new AppError("X-Device-Token requerido", 401));
  }

  const match = token.match(/^ww_dev_([^_]+)_/);
  if (!match) {
    return next(new AppError("Token de dispositivo inválido", 401));
  }

  const deviceId = match[1];
  const device = await prisma.device.findUnique({ where: { id: deviceId } });

  if (!device || device.status !== "active" || !device.deviceTokenHash) {
    return next(new AppError("Dispositivo no autorizado", 401));
  }

  const valid = await bcrypt.compare(token, device.deviceTokenHash);
  if (!valid) {
    return next(new AppError("Token de dispositivo inválido", 401));
  }

  req.device = device;
  next();
}

import prisma from "../db.js";
import { AppError } from "../utils/errors.js";
import { logTelemetry } from "../utils/logger.js";

export async function saveReading(deviceId, { nivel, bomba }, source) {
  if (typeof nivel !== "number" || nivel < 0 || nivel > 100) {
    throw new AppError("nivel debe ser un número entre 0 y 100", 400);
  }

  if (typeof bomba !== "boolean") {
    throw new AppError("bomba debe ser boolean", 400);
  }

  const device = await prisma.device.findUnique({ where: { id: deviceId } });
  if (!device || device.status !== "active") {
    throw new AppError("Dispositivo no activo", 401);
  }

  const lastSeenAt = new Date();

  const [reading] = await prisma.$transaction([
    prisma.reading.create({
      data: { deviceId, nivel, bomba, source },
    }),
    prisma.device.update({
      where: { id: deviceId },
      data: { lastSeenAt },
    }),
  ]);

  logTelemetry(deviceId, { nivel, bomba, source, lastSeenAt });

  return reading;
}

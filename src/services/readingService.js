import prisma from "../db.js";
import { AppError } from "../utils/errors.js";
import { assertOwnership } from "./deviceService.js";

export async function getNivel(userId, deviceId) {
  await assertOwnership(userId, deviceId);

  const reading = await prisma.reading.findFirst({
    where: { deviceId },
    orderBy: { recordedAt: "desc" },
  });

  if (!reading) {
    throw new AppError("Sin lecturas para este dispositivo", 404);
  }

  return { nivel: reading.nivel, recordedAt: reading.recordedAt };
}

export async function getEstado(userId, deviceId) {
  const device = await assertOwnership(userId, deviceId);

  const reading = await prisma.reading.findFirst({
    where: { deviceId },
    orderBy: { recordedAt: "desc" },
  });

  return {
    nivel: reading?.nivel ?? null,
    bomba: reading?.bomba ?? null,
    lastSeenAt: device.lastSeenAt,
    recordedAt: reading?.recordedAt ?? null,
  };
}

export async function getHistorial(userId, deviceId, { from, to } = {}) {
  await assertOwnership(userId, deviceId);

  const where = { deviceId };

  if (from || to) {
    where.recordedAt = {};
    if (from) where.recordedAt.gte = new Date(from);
    if (to) where.recordedAt.lte = new Date(to);
  }

  const readings = await prisma.reading.findMany({
    where,
    orderBy: { recordedAt: "asc" },
    select: { nivel: true, bomba: true, recordedAt: true, source: true },
  });

  return readings;
}

export async function getConfig(userId, deviceId) {
  await assertOwnership(userId, deviceId);

  const config = await prisma.deviceConfig.findUnique({ where: { deviceId } });
  return config || { deviceId, critico: 20, bajo: 40, medio: 60, maxLiters: 1000 };
}

export async function updateConfig(userId, deviceId, data) {
  await assertOwnership(userId, deviceId);

  const allowed = ["critico", "bajo", "medio", "maxLiters"];
  const update = {};

  for (const key of allowed) {
    if (data[key] !== undefined) {
      const value = Number(data[key]);
      if (!Number.isInteger(value) || value < 0) {
        throw new AppError(`${key} debe ser un entero positivo`, 400);
      }
      update[key] = value;
    }
  }

  return prisma.deviceConfig.upsert({
    where: { deviceId },
    update,
    create: { deviceId, ...update },
  });
}

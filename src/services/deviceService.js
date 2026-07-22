import crypto from "crypto";
import bcrypt from "bcrypt";
import prisma from "../db.js";
import { AppError } from "../utils/errors.js";

function generateDeviceToken(deviceId) {
  const secret = crypto.randomBytes(24).toString("base64url");
  return `ww_dev_${deviceId}_${secret}`;
}

function sanitizeDevice(device) {
  const { deviceTokenHash, ...rest } = device;
  return rest;
}

export async function claimDevice(userId, { claimCode, name }) {
  if (!claimCode) {
    throw new AppError("claimCode es requerido", 400);
  }

  const device = await prisma.device.findUnique({
    where: { claimCode: claimCode.toUpperCase() },
  });

  if (!device) {
    throw new AppError("Código de vinculación no encontrado", 404);
  }

  if (device.status !== "unclaimed") {
    throw new AppError("Este dispositivo ya fue vinculado o revocado", 409);
  }

  const deviceToken = generateDeviceToken(device.id);
  const deviceTokenHash = await bcrypt.hash(deviceToken, 10);

  const updated = await prisma.device.update({
    where: { id: device.id },
    data: {
      userId,
      name: name || null,
      status: "active",
      deviceTokenHash,
    },
  });

  await prisma.deviceConfig.upsert({
    where: { deviceId: device.id },
    update: {},
    create: { deviceId: device.id },
  });

  return {
    device: sanitizeDevice(updated),
    deviceToken,
  };
}

export async function listDevices(userId) {
  const devices = await prisma.device.findMany({
    where: { userId, status: { not: "revoked" } },
    orderBy: { createdAt: "desc" },
  });

  return devices.map(sanitizeDevice);
}

export async function getDevice(userId, deviceId) {
  const device = await prisma.device.findFirst({
    where: { id: deviceId, userId, status: { not: "revoked" } },
    include: {
      readings: {
        orderBy: { recordedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!device) {
    throw new AppError("Dispositivo no encontrado", 404);
  }

  const { readings, ...rest } = device;
  return {
    ...sanitizeDevice(rest),
    lastReading: readings[0] || null,
  };
}

export async function rotateToken(userId, deviceId) {
  const device = await prisma.device.findFirst({
    where: { id: deviceId, userId, status: "active" },
  });

  if (!device) {
    throw new AppError("Dispositivo no encontrado o inactivo", 404);
  }

  const deviceToken = generateDeviceToken(device.id);
  const deviceTokenHash = await bcrypt.hash(deviceToken, 10);

  const updated = await prisma.device.update({
    where: { id: device.id },
    data: { deviceTokenHash },
  });

  return {
    device: sanitizeDevice(updated),
    deviceToken,
  };
}

export async function revokeDevice(userId, deviceId) {
  const device = await prisma.device.findFirst({
    where: { id: deviceId, userId, status: { not: "revoked" } },
  });

  if (!device) {
    throw new AppError("Dispositivo no encontrado", 404);
  }

  const updated = await prisma.device.update({
    where: { id: device.id },
    data: {
      status: "revoked",
      userId: null,
      deviceTokenHash: null,
      name: null,
    },
  });

  return sanitizeDevice(updated);
}

export async function assertOwnership(userId, deviceId) {
  const device = await prisma.device.findFirst({
    where: { id: deviceId, userId, status: "active" },
  });

  if (!device) {
    throw new AppError("Dispositivo no encontrado", 404);
  }

  return device;
}

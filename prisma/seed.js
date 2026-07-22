import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function randomClaimCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

function randomDeviceUid() {
  return `WW-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
}

const SEED_DEVICES = [
  { deviceUid: "WW-FACTORY-001", claimCode: "DEMO0001" },
  { deviceUid: "WW-FACTORY-002", claimCode: "DEMO0002" },
  { deviceUid: "WW-FACTORY-003", claimCode: "DEMO0003" },
];

async function main() {
  for (const seed of SEED_DEVICES) {
    await prisma.device.upsert({
      where: { claimCode: seed.claimCode },
      update: {},
      create: {
        deviceUid: seed.deviceUid,
        claimCode: seed.claimCode,
        status: "unclaimed",
      },
    });
  }

  for (let i = 0; i < 2; i++) {
    const claimCode = randomClaimCode();
    await prisma.device.upsert({
      where: { claimCode },
      update: {},
      create: {
        deviceUid: randomDeviceUid(),
        claimCode,
        status: "unclaimed",
      },
    });
  }

  console.log("Seed completado: devices unclaimed creados.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

async function createClaimCode() {
  const customCode = process.argv[2]?.toUpperCase();
  const claimCode = customCode || crypto.randomBytes(4).toString("hex").toUpperCase();
  const deviceUid = `WW-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

  try {
    const device = await prisma.device.create({
      data: {
        deviceUid,
        claimCode,
        status: "unclaimed",
      },
    });

    console.log("\n==========================================");
    console.log("✅ Nuevo Dispositivo Registrado en Base de Datos");
    console.log("==========================================");
    console.log(`📌 Claim Code (Código de vinculación): ${device.claimCode}`);
    console.log(`🆔 Device UID (Fábrica):                ${device.deviceUid}`);
    console.log(`🆔 ID en BD:                             ${device.id}`);
    console.log("------------------------------------------");
    console.log("💡 Instrucciones:");
    console.log(`1. Ve a tu app / Postman y vincula usando el código: ${device.claimCode}`);
    console.log("2. Copia el 'deviceToken' que la API te responderá.");
    console.log("3. Graba ese token y el ID en tu archivo esp32_telemetry.ino\n");
  } catch (err) {
    if (err.code === "P2002") {
      console.error(`❌ El código '${claimCode}' ya existe en la base de datos.`);
    } else {
      console.error("❌ Error al crear el dispositivo:", err.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createClaimCode();

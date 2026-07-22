import assert from "node:assert";
import http from "node:http";
import express from "express";
import cors from "cors";
import authRoutes from "../src/routes/auth.js";
import deviceRoutes from "../src/routes/devices.js";
import telemetryRoutes from "../src/routes/telemetry.js";
import readingRoutes from "../src/routes/readings.js";
import { AppError } from "../src/utils/errors.js";

console.log("🧪 Iniciando pruebas de la API WereableWater...\n");

// Creación de servidor de pruebas express en memoria
const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", db: "mock_test" });
});

app.use("/api/auth", authRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/devices", telemetryRoutes);
app.use("/api", readingRoutes);

app.use((err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  res.status(500).json({ error: err.message || "Error interno del servidor" });
});

const server = app.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  try {
    // 1. Health check
    console.log("1. Probando GET /api/health...");
    const healthRes = await fetch(`${baseUrl}/health`);
    assert.strictEqual(healthRes.status, 200);
    const healthData = await healthRes.json();
    assert.strictEqual(healthData.status, "ok");
    console.log("   ✅ GET /api/health exitoso.");

    // 2. Auth error validation
    console.log("2. Probando validación en POST /api/auth/register (sin campos)...");
    const regErrRes = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.strictEqual(regErrRes.status, 400);
    console.log("   ✅ Validaciones de Auth funcionando correctamente.");

    // 3. Auth JWT token requirement
    console.log("3. Probando ruta protegida GET /api/auth/me sin Token...");
    const meErrRes = await fetch(`${baseUrl}/auth/me`);
    assert.strictEqual(meErrRes.status, 401);
    console.log("   ✅ Middleware authJwt bloqueó la petición sin token adecuadamente.");

    // 4. Device token requirement
    console.log("4. Probando POST /api/devices/telemetry sin X-Device-Token...");
    const telemErrRes = await fetch(`${baseUrl}/devices/telemetry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nivel: 50, bomba: false }),
    });
    assert.strictEqual(telemErrRes.status, 401);
    console.log("   ✅ Middleware authDevice bloqueó telemetría no autorizada.");

    console.log("\n🎉 TODAS LAS PRUEBAS DE ESTRUCTURA Y ENDPOINTS PASARON CON ÉXITO.");
  } catch (err) {
    console.error("\n❌ Error en las pruebas:", err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});

import express from "express";
import cors from "cors";
import config from "./config.js";
import prisma from "./db.js";
import authRoutes from "./routes/auth.js";
import deviceRoutes from "./routes/devices.js";
import telemetryRoutes from "./routes/telemetry.js";
import readingRoutes from "./routes/readings.js";
import { startMqttClient, stopMqttClient } from "./mqtt/brokerClient.js";
import { AppError } from "./utils/errors.js";

const app = express();

app.use(
  cors({
    origin: config.corsOrigin,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Device-Token"],
  })
);
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch {
    res.status(503).json({ status: "degraded", db: "disconnected" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/devices", telemetryRoutes);
app.use("/api", readingRoutes);

app.use((err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

const server = app.listen(config.port, () => {
  console.log(`API WereableWater en http://localhost:${config.port}`);
  startMqttClient();
});

function shutdown() {
  stopMqttClient();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

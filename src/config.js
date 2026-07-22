import dotenv from "dotenv";

dotenv.config();

const config = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  rateLimitLoginWindowMs: Number(process.env.RATE_LIMIT_LOGIN_WINDOW_MS) || 15 * 60 * 1000,
  rateLimitLoginMax: Number(process.env.RATE_LIMIT_LOGIN_MAX) || 10,
  rateLimitTelemetryWindowMs: Number(process.env.RATE_LIMIT_TELEMETRY_WINDOW_MS) || 60 * 1000,
  rateLimitTelemetryMax: Number(process.env.RATE_LIMIT_TELEMETRY_MAX) || 60,
  mqttUrl: process.env.MQTT_URL || "mqtt://localhost:1883",
  mqttServiceUser: process.env.MQTT_SERVICE_USER,
  mqttServicePass: process.env.MQTT_SERVICE_PASS,
  mqttTopicPattern: process.env.MQTT_TOPIC_PATTERN || "wereablewater/+/telemetry",
};

export default config;

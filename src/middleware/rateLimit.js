import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import config from "../config.js";

export const loginLimiter = rateLimit({
  windowMs: config.rateLimitLoginWindowMs,
  max: config.rateLimitLoginMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos de login, intenta más tarde" },
});

export const telemetryLimiter = rateLimit({
  windowMs: config.rateLimitTelemetryWindowMs,
  max: config.rateLimitTelemetryMax,
  keyGenerator: (req) =>
    req.device?.id ?? ipKeyGenerator(req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiada telemetría, espera un momento" },
});

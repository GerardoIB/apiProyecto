import { Router } from "express";
import * as readingService from "../services/readingService.js";
import { authJwt } from "../middleware/auth.js";
import { AppError, asyncHandler } from "../utils/errors.js";

const router = Router();

function requireDeviceId(req, _res, next) {
  req.deviceId = req.query.deviceId;
  if (!req.deviceId) {
    return next(new AppError("deviceId es requerido", 400));
  }
  next();
}

router.get(
  "/nivel",
  authJwt,
  requireDeviceId,
  asyncHandler(async (req, res) => {
    const data = await readingService.getNivel(req.user.id, req.deviceId);
    res.json(data);
  })
);

router.get(
  "/estado",
  authJwt,
  requireDeviceId,
  asyncHandler(async (req, res) => {
    const data = await readingService.getEstado(req.user.id, req.deviceId);
    res.json(data);
  })
);

router.get(
  "/historial",
  authJwt,
  requireDeviceId,
  asyncHandler(async (req, res) => {
    const data = await readingService.getHistorial(req.user.id, req.deviceId, {
      from: req.query.from,
      to: req.query.to,
    });
    res.json(data);
  })
);

router.get(
  "/config",
  authJwt,
  requireDeviceId,
  asyncHandler(async (req, res) => {
    const data = await readingService.getConfig(req.user.id, req.deviceId);
    res.json(data);
  })
);

router.put(
  "/config",
  authJwt,
  requireDeviceId,
  asyncHandler(async (req, res) => {
    const data = await readingService.updateConfig(
      req.user.id,
      req.deviceId,
      req.body
    );
    res.json(data);
  })
);

export default router;

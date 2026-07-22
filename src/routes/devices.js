import { Router } from "express";
import * as deviceService from "../services/deviceService.js";
import { authJwt } from "../middleware/auth.js";
import { asyncHandler } from "../utils/errors.js";

const router = Router();

router.post(
  "/claim",
  authJwt,
  asyncHandler(async (req, res) => {
    const result = await deviceService.claimDevice(req.user.id, req.body);
    res.status(201).json(result);
  })
);

router.get(
  "/",
  authJwt,
  asyncHandler(async (req, res) => {
    const devices = await deviceService.listDevices(req.user.id);
    res.json(devices);
  })
);

router.get(
  "/:id",
  authJwt,
  asyncHandler(async (req, res) => {
    const device = await deviceService.getDevice(req.user.id, req.params.id);
    res.json(device);
  })
);

router.post(
  "/:id/rotate-token",
  authJwt,
  asyncHandler(async (req, res) => {
    const result = await deviceService.rotateToken(req.user.id, req.params.id);
    res.json(result);
  })
);

router.delete(
  "/:id",
  authJwt,
  asyncHandler(async (req, res) => {
    const device = await deviceService.revokeDevice(req.user.id, req.params.id);
    res.json(device);
  })
);

export default router;

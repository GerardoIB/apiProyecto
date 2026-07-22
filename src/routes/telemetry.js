import { Router } from "express";
import * as telemetryService from "../services/telemetryService.js";
import { authDevice } from "../middleware/auth.js";
import { telemetryLimiter } from "../middleware/rateLimit.js";
import { asyncHandler } from "../utils/errors.js";

const router = Router();

router.post(
  "/telemetry",
  authDevice,
  telemetryLimiter,
  asyncHandler(async (req, res) => {
    const reading = await telemetryService.saveReading(
      req.device.id,
      req.body,
      "http"
    );
    res.status(201).json(reading);
  })
);

export default router;

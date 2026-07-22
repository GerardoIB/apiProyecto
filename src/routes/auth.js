import { Router } from "express";
import * as authService from "../services/authService.js";
import { authJwt } from "../middleware/auth.js";
import { loginLimiter } from "../middleware/rateLimit.js";
import { asyncHandler } from "../utils/errors.js";

const router = Router();

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  })
);

router.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    res.json(result);
  })
);

router.get(
  "/me",
  authJwt,
  asyncHandler(async (req, res) => {
    const user = await authService.getMe(req.user.id);
    res.json(user);
  })
);

export default router;

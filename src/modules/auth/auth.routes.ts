import { Router } from "express";
import { authController } from "./auth.controller";
import { authenticateToken } from "../../middleware/auth.middleware";

const router = Router();

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
router.post("/register", authController.register);

/**
 * POST /api/v1/auth/login
 * Login user
 */
router.post("/login", authController.login);

/**
 * POST /api/v1/auth/refresh-token
 * Refresh access token
 */
router.post("/refresh-token", authController.refreshToken);

/**
 * GET /api/v1/auth/me
 * Get current user (requires auth)
 */
router.get("/me", authenticateToken, authController.getCurrentUser);

/**
 * POST /api/v1/auth/logout
 * Logout user
 */
router.post("/logout", authenticateToken, authController.logout);

export default router;

import { Router } from "express";
import { usersController } from "./users.controller";
import { authenticateToken } from "../../middleware/auth.middleware";

export const usersRouter = Router();

/**
 * GET /api/v1/users
 * Get all users with pagination
 */
usersRouter.get("/", usersController.getAllUsers);

/**
 * GET /api/v1/users/search
 * Search users
 */
usersRouter.get("/search", usersController.searchUsers);

/**
 * GET /api/v1/users/:id
 * Get user profile by ID
 */
usersRouter.get("/:id", usersController.getUserProfile);

/**
 * PUT /api/v1/users/:id
 * Update user profile (requires auth)
 */
usersRouter.put("/:id", authenticateToken, usersController.updateProfile);

/**
 * DELETE /api/v1/users/:id/deactivate
 * Deactivate account (requires auth)
 */
usersRouter.delete("/:id/deactivate", authenticateToken, usersController.deactivateAccount);

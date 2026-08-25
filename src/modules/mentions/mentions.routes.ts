import { Router } from "express";
import { mentionsController } from "./mentions.controller";
import { authenticateToken } from "../../middleware/auth.middleware";

export const mentionsRouter = Router();

/**
 * POST /api/v1/mentions
 * Create mentions
 */
mentionsRouter.post(
  "/",
  authenticateToken,
  mentionsController.createMentions
);

/**
 * GET /api/v1/mentions
 * Get user mentions
 */
mentionsRouter.get(
  "/",
  authenticateToken,
  mentionsController.getUserMentions
);

/**
 * GET /api/v1/mentions/unread
 * Get unread mentions count
 */
mentionsRouter.get(
  "/unread",
  authenticateToken,
  mentionsController.getUnreadMentionsCount
);

/**
 * GET /api/v1/mentions/stats
 * Get mention stats
 */
mentionsRouter.get(
  "/stats",
  authenticateToken,
  mentionsController.getMentionStats
);

/**
 * GET /api/v1/mentions/search
 * Search mentions
 */
mentionsRouter.get(
  "/search",
  authenticateToken,
  mentionsController.searchMentions
);

/**
 * GET /api/v1/mentions/context/:context
 * Get mentions by context
 */
mentionsRouter.get(
  "/context/:context",
  authenticateToken,
  mentionsController.getMentionsByContext
);

/**
 * PUT /api/v1/mentions/:id/read
 * Mark mention as read
 */
mentionsRouter.put(
  "/:id/read",
  authenticateToken,
  mentionsController.markMentionAsRead
);

/**
 * PUT /api/v1/mentions/read-all
 * Mark all mentions as read
 */
mentionsRouter.put(
  "/read-all",
  authenticateToken,
  mentionsController.markAllMentionsAsRead
);

/**
 * DELETE /api/v1/mentions/:id
 * Delete mention
 */
mentionsRouter.delete(
  "/:id",
  authenticateToken,
  mentionsController.deleteMention
);

import { Router } from "express";
import { connectionsController } from "./connections.controller";
import { authenticateToken } from "../../middleware/auth.middleware";

export const connectionsRouter = Router();

/**
 * POST /api/v1/connections/send
 * Send a connection request
 */
connectionsRouter.post(
  "/send",
  authenticateToken,
  connectionsController.sendConnectionRequest
);

/**
 * POST /api/v1/connections/:id/respond
 * Accept or reject a connection request
 */
connectionsRouter.post(
  "/:id/respond",
  authenticateToken,
  connectionsController.respondToConnectionRequest
);

/**
 * DELETE /api/v1/connections/:id
 * Cancel a connection request
 */
connectionsRouter.delete(
  "/:id",
  authenticateToken,
  connectionsController.cancelConnectionRequest
);

/**
 * GET /api/v1/connections/requests/pending
 * Get pending connection requests
 */
connectionsRouter.get(
  "/requests/pending",
  authenticateToken,
  connectionsController.getPendingRequests
);

/**
 * GET /api/v1/connections
 * Get user connections
 */
connectionsRouter.get(
  "/",
  authenticateToken,
  connectionsController.getConnections
);

/**
 * GET /api/v1/connections/stats
 * Get connection stats
 */
connectionsRouter.get(
  "/stats",
  authenticateToken,
  connectionsController.getConnectionStats
);

/**
 * GET /api/v1/connections/status/:userId
 * Check connection status with another user
 */
connectionsRouter.get(
  "/status/:userId",
  authenticateToken,
  connectionsController.getConnectionStatus
);

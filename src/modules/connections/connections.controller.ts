import { Request, Response } from "express";
import { connectionsService } from "./connections.service";

export const connectionsController = {
  /**
   * Send connection request
   * POST /api/v1/connections/send
   */
  async sendConnectionRequest(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { receiverId } = req.body;

    if (!receiverId || receiverId === req.user.userId) {
      return res.status(400).json({
        success: false,
        error: "Invalid receiver ID",
      });
    }

    const result = await connectionsService.sendConnectionRequest(
      req.user.userId,
      { receiverId }
    );
    res.status(result.success ? 201 : 400).json(result);
  },

  /**
   * Respond to connection request
   * POST /api/v1/connections/:id/respond
   */
  async respondToConnectionRequest(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const connectionId = parseInt(req.params.id as string);
    const { action } = req.body;

    if (!connectionId || !["accept", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        error: "Invalid action",
      });
    }

    const result = await connectionsService.respondToConnectionRequest(
      req.user.userId,
      { connectionId, action }
    );
    res.status(result.success ? 200 : 400).json(result);
  },

  /**
   * Cancel connection request
   * DELETE /api/v1/connections/:id
   */
  async cancelConnectionRequest(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const connectionId = parseInt(req.params.id as string);

    if (!connectionId) {
      return res.status(400).json({
        success: false,
        error: "Invalid connection ID",
      });
    }

    const result = await connectionsService.cancelConnectionRequest(
      req.user.userId,
      connectionId
    );
    res.status(result.success ? 200 : 400).json(result);
  },

  /**
   * Get pending requests
   * GET /api/v1/connections/requests/pending
   */
  async getPendingRequests(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const result = await connectionsService.getPendingRequests(req.user.userId);
    res.status(result.success ? 200 : 400).json(result);
  },

  /**
   * Get user connections
   * GET /api/v1/connections
   */
  async getConnections(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await connectionsService.getConnections(
      req.user.userId,
      page,
      limit
    );
    res.status(result.success ? 200 : 400).json(result);
  },

  /**
   * Get connection stats
   * GET /api/v1/connections/stats
   */
  async getConnectionStats(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const result = await connectionsService.getConnectionStats(req.user.userId);
    res.status(result.success ? 200 : 400).json(result);
  },

  /**
   * Check connection status between two users
   * GET /api/v1/connections/status/:userId
   */
  async getConnectionStatus(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const otherUserId = parseInt(req.params.userId as string);

    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
    }

    const status = await connectionsService.getConnectionStatus(
      req.user.userId,
      otherUserId
    );

    res.json({
      success: true,
      data: { status },
    });
  },
};

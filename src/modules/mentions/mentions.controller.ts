import { Request, Response } from "express";
import { mentionsService } from "./mentions.service";

export const mentionsController = {
  /**
   * Create mentions
   * POST /api/v1/mentions
   */
  async createMentions(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { mentionedUserIds, context, contextId, message } = req.body;

    if (
      !mentionedUserIds ||
      !Array.isArray(mentionedUserIds) ||
      mentionedUserIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "mentionedUserIds array required",
      });
    }

    if (!context || !["post", "comment", "message"].includes(context)) {
      return res.status(400).json({
        success: false,
        error: "Valid context required (post, comment, or message)",
      });
    }

    if (!contextId || typeof contextId !== "number") {
      return res.status(400).json({
        success: false,
        error: "contextId required",
      });
    }

    const result = await mentionsService.createMentions(req.user.userId, {
      mentionedUserIds,
      context,
      contextId,
      message,
    });

    res.status(result.success ? 201 : 400).json(result);
  },

  /**
   * Get user mentions
   * GET /api/v1/mentions?page=1&limit=20&unreadOnly=false
   */
  async getUserMentions(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === "true";

    const result = await mentionsService.getUserMentions(
      req.user.userId,
      page,
      limit,
      unreadOnly
    );
    res.status(result.success ? 200 : 400).json(result);
  },

  /**
   * Get mentions by context
   * GET /api/v1/mentions/context/:context
   */
  async getMentionsByContext(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const context = req.params.context as string;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!["post", "comment", "message"].includes(context)) {
      return res.status(400).json({
        success: false,
        error: "Invalid context",
      });
    }

    const result = await mentionsService.getMentionsByContext(
      req.user.userId,
      context as "post" | "comment" | "message",
      limit
    );
    res.status(result.success ? 200 : 400).json(result);
  },

  /**
   * Mark mention as read
   * PUT /api/v1/mentions/:id/read
   */
  async markMentionAsRead(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const mentionId = parseInt(req.params.id as string);

    if (!mentionId) {
      return res.status(400).json({
        success: false,
        error: "Invalid mention ID",
      });
    }

    const result = await mentionsService.markMentionAsRead(
      mentionId,
      req.user.userId
    );
    res.status(result.success ? 200 : 400).json(result);
  },

  /**
   * Mark all mentions as read
   * PUT /api/v1/mentions/read-all
   */
  async markAllMentionsAsRead(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const result = await mentionsService.markAllMentionsAsRead(
      req.user.userId
    );
    res.status(result.success ? 200 : 400).json(result);
  },

  /**
   * Get mention stats
   * GET /api/v1/mentions/stats
   */
  async getMentionStats(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const result = await mentionsService.getMentionStats(req.user.userId);
    res.status(result.success ? 200 : 400).json(result);
  },

  /**
   * Get unread mentions count
   * GET /api/v1/mentions/unread
   */
  async getUnreadMentionsCount(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const result = await mentionsService.getUnreadMentionsCount(
      req.user.userId
    );
    res.status(result.success ? 200 : 400).json(result);
  },

  /**
   * Delete mention
   * DELETE /api/v1/mentions/:id
   */
  async deleteMention(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const mentionId = parseInt(req.params.id as string);

    if (!mentionId) {
      return res.status(400).json({
        success: false,
        error: "Invalid mention ID",
      });
    }

    const result = await mentionsService.deleteMention(
      mentionId,
      req.user.userId
    );
    res.status(result.success ? 200 : 400).json(result);
  },

  /**
   * Search mentions
   * GET /api/v1/mentions/search?q=term
   */
  async searchMentions(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const searchTerm = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!searchTerm || searchTerm.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Search term required",
      });
    }

    const result = await mentionsService.searchMentions(
      req.user.userId,
      searchTerm,
      limit
    );
    res.status(result.success ? 200 : 400).json(result);
  },
};

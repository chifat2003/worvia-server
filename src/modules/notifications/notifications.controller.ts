import { Request, Response } from "express";
import { notificationsService } from "./notifications.service";

export const notificationsController = {
  /**
   * Get user notifications
   * GET /api/v1/notifications
   */
  async getNotifications(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await notificationsService.getNotifications(
      req.user.userId,
      page,
      limit
    );
    res.status(result.success ? 200 : 400).json(result);
  },

  /**
   * Get unread count
   * GET /api/v1/notifications/unread
   */
  async getUnreadCount(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const result = await notificationsService.getUnreadCount(req.user.userId);
    res.status(result.success ? 200 : 400).json(result);
  },

  /**
   * Mark notification as read
   * PUT /api/v1/notifications/:id/read
   */
  async markAsRead(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const notificationId = parseInt(req.params.id as string);

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        error: "Invalid notification ID",
      });
    }

    const result = await notificationsService.markAsRead(
      notificationId,
      req.user.userId
    );
    res.status(result.success ? 200 : 400).json(result);
  },

  /**
   * Mark all as read
   * PUT /api/v1/notifications/read-all
   */
  async markAllAsRead(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const result = await notificationsService.markAllAsRead(req.user.userId);
    res.status(result.success ? 200 : 400).json(result);
  },

  /**
   * Delete notification
   * DELETE /api/v1/notifications/:id
   */
  async deleteNotification(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const notificationId = parseInt(req.params.id as string);

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        error: "Invalid notification ID",
      });
    }

    const result = await notificationsService.deleteNotification(
      notificationId,
      req.user.userId
    );
    res.status(result.success ? 200 : 400).json(result);
  },

  /**
   * Get notification stats
   * GET /api/v1/notifications/stats
   */
  async getNotificationStats(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const result = await notificationsService.getNotificationStats(
      req.user.userId
    );
    res.status(result.success ? 200 : 400).json(result);
  },

  /**
   * Get notifications by type
   * GET /api/v1/notifications/type/:type
   */
  async getNotificationsByType(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const type = req.params.type as string;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!type) {
      return res.status(400).json({
        success: false,
        error: "Type parameter required",
      });
    }

    const result = await notificationsService.getNotificationsByType(
      req.user.userId,
      type,
      limit
    );
    res.status(result.success ? 200 : 400).json(result);
  },
};

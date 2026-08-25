import { Router } from "express";
import { notificationsController } from "./notifications.controller";
import { authenticateToken } from "../../middleware/auth.middleware";

export const notificationsRouter = Router();

/**
 * GET /api/v1/notifications
 * Get user notifications
 */
notificationsRouter.get(
  "/",
  authenticateToken,
  notificationsController.getNotifications
);

/**
 * GET /api/v1/notifications/unread
 * Get unread count
 */
notificationsRouter.get(
  "/unread",
  authenticateToken,
  notificationsController.getUnreadCount
);

/**
 * GET /api/v1/notifications/stats
 * Get notification stats
 */
notificationsRouter.get(
  "/stats",
  authenticateToken,
  notificationsController.getNotificationStats
);

/**
 * GET /api/v1/notifications/type/:type
 * Get notifications by type
 */
notificationsRouter.get(
  "/type/:type",
  authenticateToken,
  notificationsController.getNotificationsByType
);

/**
 * PUT /api/v1/notifications/:id/read
 * Mark notification as read
 */
notificationsRouter.put(
  "/:id/read",
  authenticateToken,
  notificationsController.markAsRead
);

/**
 * PUT /api/v1/notifications/read-all
 * Mark all as read
 */
notificationsRouter.put(
  "/read-all",
  authenticateToken,
  notificationsController.markAllAsRead
);

/**
 * DELETE /api/v1/notifications/:id
 * Delete notification
 */
notificationsRouter.delete(
  "/:id",
  authenticateToken,
  notificationsController.deleteNotification
);

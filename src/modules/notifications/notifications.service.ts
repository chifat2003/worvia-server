import { db } from "../../db";
import { notifications, profiles } from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import {
  CreateNotificationRequest,
  NotificationResponse,
  NotificationStats,
} from "./notifications.types";

export const notificationsService = {
  /**
   * Create a notification
   */
  async createNotification(data: CreateNotificationRequest) {
    try {
      const newNotification = await db
        .insert(notifications)
        .values({
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          relatedUserId: data.relatedUserId,
          data: data.data || {},
        })
        .returning();

      return {
        success: true,
        data: newNotification[0],
      };
    } catch (error) {
      console.error("Create notification error:", error);
      return { success: false, error: "Failed to create notification" };
    }
  },

  /**
   * Get user notifications
   */
  async getNotifications(
    userId: number,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ) {
    try {
      let query = db.query.notifications.findMany({
        where: eq(notifications.userId, userId),
        orderBy: desc(notifications.createdAt),
        limit,
        offset: (page - 1) * limit,
      });

      const notifs = await query;

      // Enrich with related user profile
      const enriched = await Promise.all(
        notifs.map(async (notif) => {
          let relatedUser;
          if (notif.relatedUserId) {
            const profile = await db.query.profiles.findFirst({
              where: eq(profiles.userId, notif.relatedUserId),
            });
            relatedUser = {
              id: notif.relatedUserId,
              profile: {
                firstName: profile?.firstName || "Unknown",
                lastName: profile?.lastName || "User",
              },
            };
          }

          return {
            ...notif,
            relatedUser,
          };
        })
      );

      return {
        success: true,
        data: enriched,
        meta: { page, limit },
      };
    } catch (error) {
      console.error("Get notifications error:", error);
      return { success: false, error: "Failed to fetch notifications" };
    }
  },

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId: number): Promise<{
    success: boolean;
    data?: { count: number };
    error?: string;
  }> {
    try {
      const unreadNotifs = await db.query.notifications.findMany({
        where: eq(notifications.userId, userId),
      });

      const count = unreadNotifs.filter((n) => !n.isRead).length;

      return {
        success: true,
        data: { count },
      };
    } catch (error) {
      console.error("Get unread count error:", error);
      return { success: false, error: "Failed to fetch unread count" };
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number, userId: number) {
    try {
      const notif = await db.query.notifications.findFirst({
        where: eq(notifications.id, notificationId),
      });

      if (!notif || notif.userId !== userId) {
        return { success: false, error: "Notification not found" };
      }

      const updated = await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, notificationId))
        .returning();

      return {
        success: true,
        data: updated[0],
      };
    } catch (error) {
      console.error("Mark as read error:", error);
      return { success: false, error: "Failed to mark as read" };
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: number) {
    try {
      const userNotifs = await db.query.notifications.findMany({
        where: eq(notifications.userId, userId),
      });

      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, userId));

      return {
        success: true,
        message: `Marked ${userNotifs.length} notifications as read`,
      };
    } catch (error) {
      console.error("Mark all as read error:", error);
      return { success: false, error: "Failed to mark all as read" };
    }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: number, userId: number) {
    try {
      const notif = await db.query.notifications.findFirst({
        where: eq(notifications.id, notificationId),
      });

      if (!notif || notif.userId !== userId) {
        return { success: false, error: "Notification not found" };
      }

      await db
        .delete(notifications)
        .where(eq(notifications.id, notificationId));

      return {
        success: true,
        message: "Notification deleted",
      };
    } catch (error) {
      console.error("Delete notification error:", error);
      return { success: false, error: "Failed to delete notification" };
    }
  },

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId: number): Promise<{
    success: boolean;
    data?: NotificationStats;
    error?: string;
  }> {
    try {
      const userNotifs = await db.query.notifications.findMany({
        where: eq(notifications.userId, userId),
      });

      const unread = userNotifs.filter((n) => !n.isRead).length;

      const typesCounts: Record<string, number> = {};
      userNotifs.forEach((n) => {
        typesCounts[n.type] = (typesCounts[n.type] || 0) + 1;
      });

      return {
        success: true,
        data: {
          total: userNotifs.length,
          unread,
          types: typesCounts,
        },
      };
    } catch (error) {
      console.error("Get notification stats error:", error);
      return { success: false, error: "Failed to fetch notification stats" };
    }
  },

  /**
   * Get notifications by type
   */
  async getNotificationsByType(
    userId: number,
    type: string,
    limit: number = 20
  ) {
    try {
      const userNotifs = await db.query.notifications.findMany({
        where: eq(notifications.userId, userId),
        orderBy: desc(notifications.createdAt),
      });

      const filtered = userNotifs
        .filter((n) => n.type === type)
        .slice(0, limit);

      return {
        success: true,
        data: filtered,
        meta: { type, count: filtered.length },
      };
    } catch (error) {
      console.error("Get notifications by type error:", error);
      return { success: false, error: "Failed to fetch notifications" };
    }
  },

  /**
   * Clear old notifications
   */
  async clearOldNotifications(daysOld: number = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      // This is a simple implementation - in production you might want to use raw SQL
      const allNotifs = await db.query.notifications.findMany();
      const toDelete = allNotifs.filter((n) => n.createdAt < cutoffDate);

      for (const notif of toDelete) {
        await db
          .delete(notifications)
          .where(eq(notifications.id, notif.id));
      }

      return {
        success: true,
        message: `Deleted ${toDelete.length} old notifications`,
      };
    } catch (error) {
      console.error("Clear old notifications error:", error);
      return { success: false, error: "Failed to clear old notifications" };
    }
  },
};

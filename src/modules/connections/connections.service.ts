import { db } from "../../db";
import { connections, profiles, users, notifications } from "../../db/schema";
import { eq, and, or } from "drizzle-orm";
import {
  SendConnectionRequest,
  RespondConnectionRequest,
  ConnectionResponse,
  ConnectionStats,
} from "./connections.types";

export const connectionsService = {
  /**
   * Send a connection request
   */
  async sendConnectionRequest(userId: number, data: SendConnectionRequest) {
    try {
      // Check if user exists
      const receiver = await db.query.users.findFirst({
        where: eq(users.id, data.receiverId),
      });

      if (!receiver) {
        return { success: false, error: "User not found" };
      }

      // Check if already connected or request exists
      const existing = await db.query.connections.findFirst({
        where: and(
          eq(connections.senderId, userId),
          eq(connections.receiverId, data.receiverId)
        ),
      });

      if (existing) {
        return { success: false, error: "Connection request already exists" };
      }

      // Check for reverse connection
      const reverseConnection = await db.query.connections.findFirst({
        where: and(
          eq(connections.senderId, data.receiverId),
          eq(connections.receiverId, userId)
        ),
      });

      if (reverseConnection && reverseConnection.status === "accepted") {
        return { success: false, error: "Already connected" };
      }

      // Create connection request
      const newConnection = await db
        .insert(connections)
        .values({
          senderId: userId,
          receiverId: data.receiverId,
          status: "pending",
        })
        .returning();

      // Create notification
      const senderProfile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, userId),
      });

      const senderName = senderProfile
        ? `${senderProfile.firstName} ${senderProfile.lastName}`
        : "Someone";

      await db.insert(notifications).values({
        userId: data.receiverId,
        type: "connection_request",
        relatedUserId: userId,
        title: `${senderName} sent you a connection request`,
        message: `${senderName} wants to connect with you`,
        data: { connectionId: newConnection[0].id },
      });

      return {
        success: true,
        data: newConnection[0],
        message: "Connection request sent",
      };
    } catch (error) {
      console.error("Send connection request error:", error);
      return { success: false, error: "Failed to send connection request" };
    }
  },

  /**
   * Accept or reject a connection request
   */
  async respondToConnectionRequest(
    userId: number,
    data: RespondConnectionRequest
  ) {
    try {
      const connection = await db.query.connections.findFirst({
        where: eq(connections.id, data.connectionId),
      });

      if (!connection) {
        return { success: false, error: "Connection request not found" };
      }

      if (connection.receiverId !== userId) {
        return { success: false, error: "Unauthorized" };
      }

      if (connection.status !== "pending") {
        return { success: false, error: "Connection already responded" };
      }

      const newStatus = data.action === "accept" ? "accepted" : "rejected";

      const updated = await db
        .update(connections)
        .set({
          status: newStatus,
          respondedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(connections.id, data.connectionId))
        .returning();

      // Create notification for sender
      const senderProfile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, userId),
      });

      const userName = senderProfile
        ? `${senderProfile.firstName} ${senderProfile.lastName}`
        : "Someone";

      const message =
        data.action === "accept"
          ? `${userName} accepted your connection request`
          : `${userName} rejected your connection request`;

      await db.insert(notifications).values({
        userId: connection.senderId,
        type:
          data.action === "accept"
            ? "connection_accepted"
            : "connection_rejected",
        relatedUserId: userId,
        title: message,
        message: message,
        data: { connectionId: connection.id },
      });

      return {
        success: true,
        data: updated[0],
        message: `Connection request ${newStatus}`,
      };
    } catch (error) {
      console.error("Respond to connection request error:", error);
      return { success: false, error: "Failed to respond to connection" };
    }
  },

  /**
   * Cancel a sent connection request
   */
  async cancelConnectionRequest(userId: number, connectionId: number) {
    try {
      const connection = await db.query.connections.findFirst({
        where: eq(connections.id, connectionId),
      });

      if (!connection) {
        return { success: false, error: "Connection request not found" };
      }

      if (connection.senderId !== userId) {
        return { success: false, error: "Unauthorized" };
      }

      await db.delete(connections).where(eq(connections.id, connectionId));

      return {
        success: true,
        message: "Connection request cancelled",
      };
    } catch (error) {
      console.error("Cancel connection request error:", error);
      return { success: false, error: "Failed to cancel connection request" };
    }
  },

  /**
   * Get pending connection requests for a user
   */
  async getPendingRequests(userId: number) {
    try {
      const requests = await db.query.connections.findMany({
        where: and(
          eq(connections.receiverId, userId),
          eq(connections.status, "pending")
        ),
      });

      // Enrich with sender profiles
      const enriched = await Promise.all(
        requests.map(async (conn) => {
          const senderProfile = await db.query.profiles.findFirst({
            where: eq(profiles.userId, conn.senderId),
          });
          return {
            ...conn,
            senderProfile,
          };
        })
      );

      return {
        success: true,
        data: enriched,
        count: enriched.length,
      };
    } catch (error) {
      console.error("Get pending requests error:", error);
      return { success: false, error: "Failed to fetch pending requests" };
    }
  },

  /**
   * Get all connections (accepted) for a user
   */
  async getConnections(userId: number, page: number = 1, limit: number = 20) {
    try {
      const offset = (page - 1) * limit;

      const userConnections = await db.query.connections.findMany({
        where: and(
          or(
            eq(connections.senderId, userId),
            eq(connections.receiverId, userId)
          ),
          eq(connections.status, "accepted")
        ),
        limit,
        offset,
      });

      // Enrich with profiles
      const enriched = await Promise.all(
        userConnections.map(async (conn) => {
          const otherUserId =
            conn.senderId === userId ? conn.receiverId : conn.senderId;
          const profile = await db.query.profiles.findFirst({
            where: eq(profiles.userId, otherUserId),
          });
          return {
            ...conn,
            connectedUserId: otherUserId,
            profile,
          };
        })
      );

      return {
        success: true,
        data: enriched,
        meta: { page, limit },
      };
    } catch (error) {
      console.error("Get connections error:", error);
      return { success: false, error: "Failed to fetch connections" };
    }
  },

  /**
   * Get connection stats for a user
   */
  async getConnectionStats(userId: number): Promise<{
    success: boolean;
    data?: ConnectionStats;
    error?: string;
  }> {
    try {
      // Total accepted connections
      const totalConnections = await db.query.connections.findMany({
        where: and(
          or(
            eq(connections.senderId, userId),
            eq(connections.receiverId, userId)
          ),
          eq(connections.status, "accepted")
        ),
      });

      // Pending requests received
      const pendingRequests = await db.query.connections.findMany({
        where: and(
          eq(connections.receiverId, userId),
          eq(connections.status, "pending")
        ),
      });

      // Sent requests pending
      const sentRequests = await db.query.connections.findMany({
        where: and(
          eq(connections.senderId, userId),
          eq(connections.status, "pending")
        ),
      });

      return {
        success: true,
        data: {
          totalConnections: totalConnections.length,
          pendingRequests: pendingRequests.length,
          sentRequests: sentRequests.length,
        },
      };
    } catch (error) {
      console.error("Get connection stats error:", error);
      return { success: false, error: "Failed to fetch connection stats" };
    }
  },

  /**
   * Check if two users are connected
   */
  async areConnected(userId1: number, userId2: number): Promise<boolean> {
    try {
      const connection = await db.query.connections.findFirst({
        where: and(
          or(
            and(
              eq(connections.senderId, userId1),
              eq(connections.receiverId, userId2)
            ),
            and(
              eq(connections.senderId, userId2),
              eq(connections.receiverId, userId1)
            )
          ),
          eq(connections.status, "accepted")
        ),
      });

      return !!connection;
    } catch (error) {
      console.error("Check connected error:", error);
      return false;
    }
  },

  /**
   * Get connection status between two users
   */
  async getConnectionStatus(
    userId1: number,
    userId2: number
  ): Promise<string | null> {
    try {
      const connection = await db.query.connections.findFirst({
        where: or(
          and(
            eq(connections.senderId, userId1),
            eq(connections.receiverId, userId2)
          ),
          and(
            eq(connections.senderId, userId2),
            eq(connections.receiverId, userId1)
          )
        ),
      });

      return connection?.status || null;
    } catch (error) {
      console.error("Get connection status error:", error);
      return null;
    }
  },
};

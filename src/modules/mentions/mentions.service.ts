import { db } from "../../db";
import { mentions, profiles, notifications } from "../../db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  CreateMentionRequest,
  MentionResponse,
  MentionStats,
} from "./mentions.types";

export const mentionsService = {
  /**
   * Create mentions for multiple users
   */
  async createMentions(
    mentionedByUserId: number,
    data: CreateMentionRequest
  ) {
    try {
      const createdMentions = [];

      // Get the profile of the user making the mention
      const mentionerProfile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, mentionedByUserId),
      });

      const mentionerName = mentionerProfile
        ? `${mentionerProfile.firstName} ${mentionerProfile.lastName}`
        : "Someone";

      // Create a mention for each user
      for (const userId of data.mentionedUserIds) {
        // Skip self-mentions
        if (userId === mentionedByUserId) {
          continue;
        }

        // Create mention record
        const newMention = await db
          .insert(mentions)
          .values({
            mentionedUserId: userId,
            mentionedByUserId: mentionedByUserId,
            context: data.context,
            contextId: data.contextId,
            isRead: false,
          })
          .returning();

        createdMentions.push(newMention[0]);

        // Create notification for mentioned user
        const contextLabel =
          data.context === "post"
            ? "post"
            : data.context === "comment"
              ? "comment"
              : "message";

        await db.insert(notifications).values({
          userId,
          type: "mention",
          relatedUserId: mentionedByUserId,
          title: `${mentionerName} mentioned you in a ${contextLabel}`,
          message: data.message || `You were mentioned in a ${contextLabel}`,
          data: {
            mentionId: newMention[0].id,
            context: data.context,
            contextId: data.contextId,
          },
        });
      }

      return {
        success: true,
        data: createdMentions,
        message: `${createdMentions.length} user${createdMentions.length !== 1 ? "s" : ""} mentioned`,
      };
    } catch (error) {
      console.error("Create mentions error:", error);
      return { success: false, error: "Failed to create mentions" };
    }
  },

  /**
   * Get mentions for a user
   */
  async getUserMentions(
    userId: number,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ) {
    try {
      let allMentions = await db.query.mentions.findMany({
        where: eq(mentions.mentionedUserId, userId),
        orderBy: desc(mentions.createdAt),
      });

      if (unreadOnly) {
        allMentions = allMentions.filter((m) => !m.isRead);
      }

      const start = (page - 1) * limit;
      const paginatedMentions = allMentions.slice(start, start + limit);

      // Enrich with mentioner profile
      const enriched = await Promise.all(
        paginatedMentions.map(async (mention) => {
          const profile = await db.query.profiles.findFirst({
            where: eq(profiles.userId, mention.mentionedByUserId),
          });

          return {
            ...mention,
            mentionedByProfile: profile
              ? {
                  firstName: profile.firstName,
                  lastName: profile.lastName,
                  profilePhoto: profile.profilePhoto || undefined,
                }
              : undefined,
          };
        })
      );

      return {
        success: true,
        data: enriched,
        meta: {
          page,
          limit,
          total: allMentions.length,
        },
      };
    } catch (error) {
      console.error("Get user mentions error:", error);
      return { success: false, error: "Failed to fetch mentions" };
    }
  },

  /**
   * Get mentions in a specific context (post/comment/message)
   */
  async getMentionsByContext(
    userId: number,
    context: "post" | "comment" | "message",
    limit: number = 20
  ) {
    try {
      const userMentions = await db.query.mentions.findMany({
        where: and(
          eq(mentions.mentionedUserId, userId),
          eq(mentions.context, context)
        ),
        orderBy: desc(mentions.createdAt),
      });

      const topMentions = userMentions.slice(0, limit);

      // Enrich with mentioner profile
      const enriched = await Promise.all(
        topMentions.map(async (mention) => {
          const profile = await db.query.profiles.findFirst({
            where: eq(profiles.userId, mention.mentionedByUserId),
          });

          return {
            ...mention,
            mentionedByProfile: profile
              ? {
                  firstName: profile.firstName,
                  lastName: profile.lastName,
                  profilePhoto: profile.profilePhoto || undefined,
                }
              : undefined,
          };
        })
      );

      return {
        success: true,
        data: enriched,
        meta: { context, count: enriched.length },
      };
    } catch (error) {
      console.error("Get mentions by context error:", error);
      return { success: false, error: "Failed to fetch mentions" };
    }
  },

  /**
   * Mark mention as read
   */
  async markMentionAsRead(mentionId: number, userId: number) {
    try {
      const mention = await db.query.mentions.findFirst({
        where: eq(mentions.id, mentionId),
      });

      if (!mention || mention.mentionedUserId !== userId) {
        return { success: false, error: "Mention not found" };
      }

      const updated = await db
        .update(mentions)
        .set({ isRead: true })
        .where(eq(mentions.id, mentionId))
        .returning();

      return {
        success: true,
        data: updated[0],
      };
    } catch (error) {
      console.error("Mark mention as read error:", error);
      return { success: false, error: "Failed to mark mention as read" };
    }
  },

  /**
   * Mark all mentions as read
   */
  async markAllMentionsAsRead(userId: number) {
    try {
      const userMentions = await db.query.mentions.findMany({
        where: eq(mentions.mentionedUserId, userId),
      });

      await db
        .update(mentions)
        .set({ isRead: true })
        .where(eq(mentions.mentionedUserId, userId));

      return {
        success: true,
        message: `Marked ${userMentions.length} mentions as read`,
      };
    } catch (error) {
      console.error("Mark all mentions as read error:", error);
      return { success: false, error: "Failed to mark all mentions as read" };
    }
  },

  /**
   * Get mention stats for a user
   */
  async getMentionStats(userId: number): Promise<{
    success: boolean;
    data?: MentionStats;
    error?: string;
  }> {
    try {
      const userMentions = await db.query.mentions.findMany({
        where: eq(mentions.mentionedUserId, userId),
      });

      const unreadCount = userMentions.filter((m) => !m.isRead).length;

      const byContext: Record<string, number> = {};
      userMentions.forEach((mention) => {
        byContext[mention.context] =
          (byContext[mention.context] || 0) + 1;
      });

      return {
        success: true,
        data: {
          total: userMentions.length,
          unread: unreadCount,
          byContext,
        },
      };
    } catch (error) {
      console.error("Get mention stats error:", error);
      return { success: false, error: "Failed to fetch mention stats" };
    }
  },

  /**
   * Get unread mentions count
   */
  async getUnreadMentionsCount(userId: number): Promise<{
    success: boolean;
    data?: { count: number };
    error?: string;
  }> {
    try {
      const userMentions = await db.query.mentions.findMany({
        where: eq(mentions.mentionedUserId, userId),
      });

      const count = userMentions.filter((m) => !m.isRead).length;

      return {
        success: true,
        data: { count },
      };
    } catch (error) {
      console.error("Get unread mentions count error:", error);
      return { success: false, error: "Failed to fetch unread mentions count" };
    }
  },

  /**
   * Delete a mention
   */
  async deleteMention(mentionId: number, userId: number) {
    try {
      const mention = await db.query.mentions.findFirst({
        where: eq(mentions.id, mentionId),
      });

      if (!mention || mention.mentionedUserId !== userId) {
        return { success: false, error: "Mention not found" };
      }

      await db.delete(mentions).where(eq(mentions.id, mentionId));

      return {
        success: true,
        message: "Mention deleted",
      };
    } catch (error) {
      console.error("Delete mention error:", error);
      return { success: false, error: "Failed to delete mention" };
    }
  },

  /**
   * Search mentions by context and user
   */
  async searchMentions(
    userId: number,
    searchTerm: string,
    limit: number = 20
  ) {
    try {
      const userMentions = await db.query.mentions.findMany({
        where: eq(mentions.mentionedUserId, userId),
        orderBy: desc(mentions.createdAt),
      });

      // Filter by mentioner name
      const results = [];
      for (const mention of userMentions) {
        const profile = await db.query.profiles.findFirst({
          where: eq(profiles.userId, mention.mentionedByUserId),
        });

        if (profile) {
          const fullName = `${profile.firstName} ${profile.lastName}`;
          if (
            fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mention.context.toLowerCase().includes(searchTerm.toLowerCase())
          ) {
            results.push({
              ...mention,
              mentionedByProfile: {
                firstName: profile.firstName,
                lastName: profile.lastName,
                profilePhoto: profile.profilePhoto || undefined,
              },
            });
          }
        }

        if (results.length >= limit) break;
      }

      return {
        success: true,
        data: results,
        meta: { searchTerm, count: results.length },
      };
    } catch (error) {
      console.error("Search mentions error:", error);
      return { success: false, error: "Failed to search mentions" };
    }
  },
};

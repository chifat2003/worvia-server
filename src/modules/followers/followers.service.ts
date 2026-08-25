import { db } from "../../db";
import { followers, profiles, users, notifications } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { FollowResponse, FollowerStats } from "./followers.types";

export const followersService = {
  /**
   * Follow a user
   */
  async followUser(followerId: number, followingId: number) {
    try {
      // Validate user exists
      const targetUser = await db.query.users.findFirst({
        where: eq(users.id, followingId),
      });

      if (!targetUser) {
        return { success: false, error: "User not found" };
      }

      if (followerId === followingId) {
        return { success: false, error: "Cannot follow yourself" };
      }

      // Check if already following
      const existing = await db.query.followers.findFirst({
        where: and(
          eq(followers.followerId, followerId),
          eq(followers.followingId, followingId)
        ),
      });

      if (existing) {
        return { success: false, error: "Already following this user" };
      }

      // Create follow relationship
      const newFollow = await db
        .insert(followers)
        .values({
          followerId,
          followingId,
        })
        .returning();

      // Create notification
      const followerProfile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, followerId),
      });

      const followerName = followerProfile
        ? `${followerProfile.firstName} ${followerProfile.lastName}`
        : "Someone";

      await db.insert(notifications).values({
        userId: followingId,
        type: "follow",
        relatedUserId: followerId,
        title: `${followerName} started following you`,
        message: `${followerName} is now following your profile`,
        data: { followerId },
      });

      return {
        success: true,
        data: newFollow[0],
        message: "User followed successfully",
      };
    } catch (error) {
      console.error("Follow user error:", error);
      return { success: false, error: "Failed to follow user" };
    }
  },

  /**
   * Unfollow a user
   */
  async unfollowUser(followerId: number, followingId: number) {
    try {
      const follow = await db.query.followers.findFirst({
        where: and(
          eq(followers.followerId, followerId),
          eq(followers.followingId, followingId)
        ),
      });

      if (!follow) {
        return { success: false, error: "Not following this user" };
      }

      await db
        .delete(followers)
        .where(
          and(
            eq(followers.followerId, followerId),
            eq(followers.followingId, followingId)
          )
        );

      return {
        success: true,
        message: "User unfollowed successfully",
      };
    } catch (error) {
      console.error("Unfollow user error:", error);
      return { success: false, error: "Failed to unfollow user" };
    }
  },

  /**
   * Get user followers
   */
  async getFollowers(
    userId: number,
    page: number = 1,
    limit: number = 20
  ) {
    try {
      const offset = (page - 1) * limit;

      const userFollowers = await db.query.followers.findMany({
        where: eq(followers.followingId, userId),
        limit,
        offset,
      });

      // Enrich with profiles
      const enriched = await Promise.all(
        userFollowers.map(async (follow) => {
          const profile = await db.query.profiles.findFirst({
            where: eq(profiles.userId, follow.followerId),
          });
          return {
            ...follow,
            profile,
          };
        })
      );

      return {
        success: true,
        data: enriched,
        meta: { page, limit, total: enriched.length },
      };
    } catch (error) {
      console.error("Get followers error:", error);
      return { success: false, error: "Failed to fetch followers" };
    }
  },

  /**
   * Get users that a user is following
   */
  async getFollowing(
    userId: number,
    page: number = 1,
    limit: number = 20
  ) {
    try {
      const offset = (page - 1) * limit;

      const following = await db.query.followers.findMany({
        where: eq(followers.followerId, userId),
        limit,
        offset,
      });

      // Enrich with profiles
      const enriched = await Promise.all(
        following.map(async (follow) => {
          const profile = await db.query.profiles.findFirst({
            where: eq(profiles.userId, follow.followingId),
          });
          return {
            ...follow,
            profile,
          };
        })
      );

      return {
        success: true,
        data: enriched,
        meta: { page, limit, total: enriched.length },
      };
    } catch (error) {
      console.error("Get following error:", error);
      return { success: false, error: "Failed to fetch following" };
    }
  },

  /**
   * Get follower stats
   */
  async getFollowerStats(userId: number): Promise<{
    success: boolean;
    data?: FollowerStats;
    error?: string;
  }> {
    try {
      const followerCount = await db.query.followers.findMany({
        where: eq(followers.followingId, userId),
      });

      const followingCount = await db.query.followers.findMany({
        where: eq(followers.followerId, userId),
      });

      return {
        success: true,
        data: {
          followers: followerCount.length,
          following: followingCount.length,
        },
      };
    } catch (error) {
      console.error("Get follower stats error:", error);
      return { success: false, error: "Failed to fetch follower stats" };
    }
  },

  /**
   * Check if user is following another user
   */
  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    try {
      const follow = await db.query.followers.findFirst({
        where: and(
          eq(followers.followerId, followerId),
          eq(followers.followingId, followingId)
        ),
      });

      return !!follow;
    } catch (error) {
      console.error("Check following error:", error);
      return false;
    }
  },
};

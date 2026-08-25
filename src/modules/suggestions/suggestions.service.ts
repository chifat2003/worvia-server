import { db } from "../../db";
import {
  users,
  profiles,
  connections,
  followers,
} from "../../db/schema";
import { eq, and, or, ne } from "drizzle-orm";
import { SuggestionUser, SuggestionsResponse } from "./suggestions.types";

/**
 * Helper function to get mutual connections between two users
 */
async function getMutualConnections(
  userId1: number,
  userId2: number
): Promise<number[]> {
  try {
    // Get connections for user1
    const user1Connections = await db.query.connections.findMany({
      where: and(
        or(
          eq(connections.senderId, userId1),
          eq(connections.receiverId, userId1)
        ),
        eq(connections.status, "accepted")
      ),
    });

    const user1ConnectedIds = new Set(
      user1Connections.flatMap((c) => [c.senderId, c.receiverId])
    );

    // Get connections for user2
    const user2Connections = await db.query.connections.findMany({
      where: and(
        or(
          eq(connections.senderId, userId2),
          eq(connections.receiverId, userId2)
        ),
        eq(connections.status, "accepted")
      ),
    });

    const user2ConnectedIds = new Set(
      user2Connections.flatMap((c) => [c.senderId, c.receiverId])
    );

    // Find intersection
    const mutual = Array.from(user1ConnectedIds).filter(
      (id) =>
        user2ConnectedIds.has(id) && id !== userId1 && id !== userId2
    );

    return mutual;
  } catch (error) {
    console.error("Get mutual connections error:", error);
    return [];
  }
}

export const suggestionsService = {
  /**
   * Get connection suggestions using a hybrid algorithm
   * Algorithm factors:
   * 1. Mutual connections (strongest signal)
   * 2. Shared skills (strong signal)
   * 3. Same location (moderate signal)
   * 4. Similar role/industry (moderate signal)
   * 5. Network proximity (followers/following)
   */
  async getConnectionSuggestions(
    userId: number,
    limit: number = 10
  ): Promise<SuggestionsResponse> {
    try {
      // Get current user's profile
      const userProfile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, userId),
      });

      if (!userProfile) {
        return { success: false, error: "User profile not found" };
      }

      // Get all users except current user and already connected
      const allUsers = await db.query.users.findMany();

      // Get current connections (both sent and received, accepted)
      const userConnections = await db.query.connections.findMany({
        where: and(
          or(
            eq(connections.senderId, userId),
            eq(connections.receiverId, userId)
          ),
          eq(connections.status, "accepted")
        ),
      });

      const connectedUserIds = new Set(
        userConnections.flatMap((c) => [c.senderId, c.receiverId])
      );

      // Get pending requests
      const pendingRequests = await db.query.connections.findMany({
        where: or(
          and(
            eq(connections.senderId, userId),
            eq(connections.status, "pending")
          ),
          and(
            eq(connections.receiverId, userId),
            eq(connections.status, "pending")
          )
        ),
      });

      const pendingUserIds = new Set(
        pendingRequests.flatMap((c) => [c.senderId, c.receiverId])
      );

      // Get user's followers and following
      const userFollowers = await db.query.followers.findMany({
        where: eq(followers.followingId, userId),
      });

      const userFollowing = await db.query.followers.findMany({
        where: eq(followers.followerId, userId),
      });

      const userNetwork = new Set([
        ...userFollowers.map((f) => f.followerId),
        ...userFollowing.map((f) => f.followingId),
      ]);

      // Calculate suggestions
      const suggestions: SuggestionUser[] = [];

      for (const targetUser of allUsers) {
        // Skip self, already connected, and pending
        if (
          targetUser.id === userId ||
          connectedUserIds.has(targetUser.id) ||
          pendingUserIds.has(targetUser.id)
        ) {
          continue;
        }

        const targetProfile = await db.query.profiles.findFirst({
          where: eq(profiles.userId, targetUser.id),
        });

        if (!targetProfile) continue;

        // Calculate match score
        let matchScore = 0;
        let matchReasons: string[] = [];
        let sharedSkills: string[] = [];

        // 1. Mutual connections (40 points max)
        const mutualConnections = await getMutualConnections(
          userId,
          targetUser.id
        );
        const mutualScore = Math.min(mutualConnections.length * 10, 40);
        matchScore += mutualScore;
        if (mutualConnections.length > 0) {
          matchReasons.push(
            `${mutualConnections.length} mutual connection${mutualConnections.length > 1 ? "s" : ""}`
          );
        }

        // 2. Shared skills (30 points max)
        const userSkills = Array.isArray(userProfile.skills)
          ? (userProfile.skills as string[])
          : [];
        const targetSkills = Array.isArray(targetProfile.skills)
          ? (targetProfile.skills as string[])
          : [];
        sharedSkills = userSkills.filter((skill) =>
          targetSkills.some(
            (s) => s.toLowerCase() === skill.toLowerCase()
          )
        );
        const skillsScore = Math.min(sharedSkills.length * 10, 30);
        matchScore += skillsScore;
        if (sharedSkills.length > 0) {
          matchReasons.push(`${sharedSkills.length} shared skill${sharedSkills.length > 1 ? "s" : ""}`);
        }

        // 3. Same location (15 points)
        if (
          userProfile.location &&
          targetProfile.location &&
          userProfile.location.toLowerCase() ===
            targetProfile.location.toLowerCase()
        ) {
          matchScore += 15;
          matchReasons.push("Same location");
        }

        // 4. In user's network (10 points)
        if (userNetwork.has(targetUser.id)) {
          matchScore += 10;
          matchReasons.push("In your network");
        }

        // 5. Network proximity - users who follow people the user knows
        const targetFollowing = await db.query.followers.findMany({
          where: eq(followers.followerId, targetUser.id),
        });
        const targetFollowingIds = new Set(
          targetFollowing.map((f) => f.followingId)
        );
        const proximityCount = Array.from(userNetwork).filter((id) =>
          targetFollowingIds.has(id)
        ).length;
        const proximityScore = Math.min(proximityCount * 5, 15);
        matchScore += proximityScore;

        if (matchScore > 0) {
          suggestions.push({
            id: targetUser.id,
            email: targetUser.email,
            profile: {
              firstName: targetProfile.firstName,
              lastName: targetProfile.lastName,
              headline: targetProfile.headline || undefined,
              summary: targetProfile.summary || undefined,
              location: targetProfile.location || undefined,
              skills: targetSkills,
            },
            matchScore,
            matchReason: matchReasons.join(" • "),
            mutualConnections: mutualConnections.length,
            sharedSkills,
          });
        }
      }

      // Sort by match score descending
      suggestions.sort((a, b) => b.matchScore - a.matchScore);

      return {
        success: true,
        data: suggestions.slice(0, limit),
        meta: {
          total: suggestions.length,
          algorithm: "Hybrid: Mutual Connections + Skills + Location + Network",
        },
      };
    } catch (error) {
      console.error("Get suggestions error:", error);
      return { success: false, error: "Failed to fetch suggestions" };
    }
  },

  /**
   * Get mutual connections between two users
   */
  async getMutualConnections(
    userId1: number,
    userId2: number
  ): Promise<number[]> {
    return getMutualConnections(userId1, userId2);
  },

  /**
   * Get personalized suggestions based on user behavior
   */
  async getPersonalizedSuggestions(
    userId: number,
    limit: number = 10
  ): Promise<SuggestionsResponse> {
    // For now, this is the same as connection suggestions
    // In production, you might factor in:
    // - User's browsing history
    // - Engagement metrics
    // - Time of day / context
    // - Machine learning model
    return this.getConnectionSuggestions(userId, limit);
  },

  /**
   * Get suggestions for a specific skill
   */
  async getSuggestionsBySkill(
    userId: number,
    skill: string,
    limit: number = 10
  ): Promise<SuggestionsResponse> {
    try {
      const userProfile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, userId),
      });

      if (!userProfile) {
        return { success: false, error: "User profile not found" };
      }

      const allUsers = await db.query.users.findMany();

      // Get current connections
      const userConnections = await db.query.connections.findMany({
        where: and(
          or(
            eq(connections.senderId, userId),
            eq(connections.receiverId, userId)
          ),
          eq(connections.status, "accepted")
        ),
      });

      const connectedUserIds = new Set(
        userConnections.flatMap((c) => [c.senderId, c.receiverId])
      );

      const suggestions: SuggestionUser[] = [];

      for (const targetUser of allUsers) {
        if (targetUser.id === userId || connectedUserIds.has(targetUser.id)) {
          continue;
        }

        const targetProfile = await db.query.profiles.findFirst({
          where: eq(profiles.userId, targetUser.id),
        });

        if (!targetProfile) continue;

        const targetSkills = Array.isArray(targetProfile.skills)
          ? (targetProfile.skills as string[])
          : [];

        // Check if target has the skill
        if (
          targetSkills.some(
            (s) => s.toLowerCase() === skill.toLowerCase()
          )
        ) {
          const mutualConnections = await getMutualConnections(
            userId,
            targetUser.id
          );
          const userSkills = Array.isArray(userProfile.skills)
            ? (userProfile.skills as string[])
            : [];
          const sharedSkills = userSkills.filter((s) =>
            targetSkills.some(
              (ts) => ts.toLowerCase() === s.toLowerCase()
            )
          );

          suggestions.push({
            id: targetUser.id,
            email: targetUser.email,
            profile: {
              firstName: targetProfile.firstName,
              lastName: targetProfile.lastName,
              headline: targetProfile.headline || undefined,
              skills: targetSkills,
            },
            matchScore: 100,
            matchReason: `Expert in ${skill}`,
            mutualConnections: mutualConnections.length,
            sharedSkills,
          });
        }
      }

      // Sort by mutual connections
      suggestions.sort(
        (a, b) => b.mutualConnections - a.mutualConnections
      );

      return {
        success: true,
        data: suggestions.slice(0, limit),
        meta: {
          total: suggestions.length,
          algorithm: `Skill-based matching: ${skill}`,
        },
      };
    } catch (error) {
      console.error("Get suggestions by skill error:", error);
      return { success: false, error: "Failed to fetch suggestions" };
    }
  },

  /**
   * Get suggestions for users in the same location
   */
  async getSuggestionsByLocation(
    userId: number,
    limit: number = 10
  ): Promise<SuggestionsResponse> {
    try {
      const userProfile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, userId),
      });

      if (!userProfile || !userProfile.location) {
        return { success: false, error: "User location not found" };
      }

      const allUsers = await db.query.users.findMany();

      // Get current connections
      const userConnections = await db.query.connections.findMany({
        where: and(
          or(
            eq(connections.senderId, userId),
            eq(connections.receiverId, userId)
          ),
          eq(connections.status, "accepted")
        ),
      });

      const connectedUserIds = new Set(
        userConnections.flatMap((c) => [c.senderId, c.receiverId])
      );

      const suggestions: SuggestionUser[] = [];

      for (const targetUser of allUsers) {
        if (targetUser.id === userId || connectedUserIds.has(targetUser.id)) {
          continue;
        }

        const targetProfile = await db.query.profiles.findFirst({
          where: eq(profiles.userId, targetUser.id),
        });

        if (!targetProfile || !targetProfile.location) continue;

        // Check if same location
        if (
          userProfile.location.toLowerCase() ===
          targetProfile.location.toLowerCase()
        ) {
          const mutualConnections = await getMutualConnections(
            userId,
            targetUser.id
          );
          const userSkills = Array.isArray(userProfile.skills)
            ? (userProfile.skills as string[])
            : [];
          const targetSkills = Array.isArray(targetProfile.skills)
            ? (targetProfile.skills as string[])
            : [];
          const sharedSkills = userSkills.filter((s) =>
            targetSkills.some(
              (ts) => ts.toLowerCase() === s.toLowerCase()
            )
          );

          suggestions.push({
            id: targetUser.id,
            email: targetUser.email,
            profile: {
              firstName: targetProfile.firstName,
              lastName: targetProfile.lastName,
              headline: targetProfile.headline || undefined,
              location: targetProfile.location,
              skills: targetSkills,
            },
            matchScore: 100,
            matchReason: `In ${userProfile.location}`,
            mutualConnections: mutualConnections.length,
            sharedSkills,
          });
        }
      }

      // Sort by mutual connections
      suggestions.sort(
        (a, b) => b.mutualConnections - a.mutualConnections
      );

      return {
        success: true,
        data: suggestions.slice(0, limit),
        meta: {
          total: suggestions.length,
          algorithm: `Location-based: ${userProfile.location}`,
        },
      };
    } catch (error) {
      console.error("Get suggestions by location error:", error);
      return { success: false, error: "Failed to fetch suggestions" };
    }
  },
};

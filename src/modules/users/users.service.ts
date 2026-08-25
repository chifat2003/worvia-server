import { db } from "../../db";
import { users, profiles } from "../../db/schema";
import { eq } from "drizzle-orm";
import { UpdateProfileRequest } from "../auth/auth.types";

export const usersService = {
  /**
   * Get user by ID with profile
   */
  async getUserProfile(userId: number) {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        return { success: false, error: "User not found" };
      }

      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, userId),
      });

      return {
        success: true,
        data: {
          user,
          profile,
        },
      };
    } catch (error) {
      console.error("Get user profile error:", error);
      return { success: false, error: "Failed to fetch user profile" };
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: number, data: UpdateProfileRequest) {
    try {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, userId),
      });

      if (!profile) {
        return { success: false, error: "Profile not found" };
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (data.firstName !== undefined) updateData.firstName = data.firstName;
      if (data.lastName !== undefined) updateData.lastName = data.lastName;
      if (data.headline !== undefined) updateData.headline = data.headline;
      if (data.summary !== undefined) updateData.summary = data.summary;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.skills !== undefined) updateData.skills = JSON.stringify(data.skills);
      if (data.visibility !== undefined) updateData.visibility = data.visibility;

      const updated = await db
        .update(profiles)
        .set(updateData)
        .where(eq(profiles.userId, userId))
        .returning();

      return {
        success: true,
        data: updated[0],
      };
    } catch (error) {
      console.error("Update profile error:", error);
      return { success: false, error: "Failed to update profile" };
    }
  },

  /**
   * Get all users (with pagination)
   */
  async getAllUsers(page: number = 1, limit: number = 20) {
    try {
      const offset = (page - 1) * limit;

      const userList = await db.query.users.findMany({
        limit,
        offset,
      });

      return {
        success: true,
        data: userList,
        meta: {
          page,
          limit,
        },
      };
    } catch (error) {
      console.error("Get all users error:", error);
      return { success: false, error: "Failed to fetch users" };
    }
  },

  /**
   * Search users by email or name
   */
  async searchUsers(query: string, limit: number = 10) {
    try {
      // This is a basic search, in production you might use full-text search
      const userList = await db.query.users.findMany({
        limit,
      });

      // Filter by email
      const filtered = userList.filter((u) =>
        u.email.toLowerCase().includes(query.toLowerCase())
      );

      return {
        success: true,
        data: filtered,
      };
    } catch (error) {
      console.error("Search users error:", error);
      return { success: false, error: "Failed to search users" };
    }
  },

  /**
   * Deactivate user account
   */
  async deactivateAccount(userId: number) {
    try {
      const updated = await db
        .update(users)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();

      return {
        success: true,
        message: "Account deactivated",
        data: updated[0],
      };
    } catch (error) {
      console.error("Deactivate account error:", error);
      return { success: false, error: "Failed to deactivate account" };
    }
  },
};

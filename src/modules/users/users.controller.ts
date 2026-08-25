import { Request, Response } from "express";
import { usersService } from "./users.service";

export const usersController = {
  /**
   * Get user profile
   */
  async getUserProfile(req: Request, res: Response) {
    const userId = parseInt(req.params.id as string);

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    const result = await usersService.getUserProfile(userId);
    res.status(result.success ? 200 : 404).json(result);
  },

  /**
   * Update user profile
   */
  async updateProfile(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const result = await usersService.updateProfile(req.user.userId, req.body);
    res.status(result.success ? 200 : 400).json(result);
  },

  /**
   * Get all users
   */
  async getAllUsers(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await usersService.getAllUsers(page, limit);
    res.status(result.success ? 200 : 500).json(result);
  },

  /**
   * Search users
   */
  async searchUsers(req: Request, res: Response) {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: "Search query required",
      });
    }

    const result = await usersService.searchUsers(query, limit);
    res.status(result.success ? 200 : 500).json(result);
  },

  /**
   * Deactivate account
   */
  async deactivateAccount(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const result = await usersService.deactivateAccount(req.user.userId);
    res.status(result.success ? 200 : 400).json(result);
  },
};

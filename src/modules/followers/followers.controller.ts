import { Request, Response } from "express";
import { followersService } from "./followers.service";

export const followersController = {
  /**
   * Follow a user
   * POST /api/v1/followers/follow/:userId
   */
  async followUser(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const followingId = parseInt(req.params.userId as string);

    if (!followingId || followingId === req.user.userId) {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
    }

    const result = await followersService.followUser(
      req.user.userId,
      followingId
    );
    res.status(result.success ? 201 : 400).json(result);
  },

  /**
   * Unfollow a user
   * DELETE /api/v1/followers/unfollow/:userId
   */
  async unfollowUser(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const followingId = parseInt(req.params.userId as string);

    if (!followingId) {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
    }

    const result = await followersService.unfollowUser(
      req.user.userId,
      followingId
    );
    res.status(result.success ? 200 : 400).json(result);
  },

  /**
   * Get user followers
   * GET /api/v1/followers/:userId
   */
  async getFollowers(req: Request, res: Response) {
    const userId = parseInt(req.params.userId as string);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
    }

    const result = await followersService.getFollowers(userId, page, limit);
    res.status(result.success ? 200 : 400).json(result);
  },

  /**
   * Get users that a user is following
   * GET /api/v1/followers/:userId/following
   */
  async getFollowing(req: Request, res: Response) {
    const userId = parseInt(req.params.userId as string);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
    }

    const result = await followersService.getFollowing(userId, page, limit);
    res.status(result.success ? 200 : 400).json(result);
  },

  /**
   * Get follower stats
   * GET /api/v1/followers/:userId/stats
   */
  async getFollowerStats(req: Request, res: Response) {
    const userId = parseInt(req.params.userId as string);

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
    }

    const result = await followersService.getFollowerStats(userId);
    res.status(result.success ? 200 : 400).json(result);
  },

  /**
   * Check if following
   * GET /api/v1/followers/check/:userId
   */
  async isFollowing(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const userId = parseInt(req.params.userId as string);

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
    }

    const isFollowing = await followersService.isFollowing(
      req.user.userId,
      userId
    );
    res.json({
      success: true,
      data: { isFollowing },
    });
  },
};

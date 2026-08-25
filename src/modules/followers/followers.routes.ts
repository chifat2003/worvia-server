import { Router } from "express";
import { followersController } from "./followers.controller";
import { authenticateToken } from "../../middleware/auth.middleware";

export const followersRouter = Router();

/**
 * POST /api/v1/followers/follow/:userId
 * Follow a user
 */
followersRouter.post(
  "/follow/:userId",
  authenticateToken,
  followersController.followUser
);

/**
 * DELETE /api/v1/followers/unfollow/:userId
 * Unfollow a user
 */
followersRouter.delete(
  "/unfollow/:userId",
  authenticateToken,
  followersController.unfollowUser
);

/**
 * GET /api/v1/followers/:userId
 * Get user followers
 */
followersRouter.get("/:userId", followersController.getFollowers);

/**
 * GET /api/v1/followers/:userId/following
 * Get users that a user is following
 */
followersRouter.get("/:userId/following", followersController.getFollowing);

/**
 * GET /api/v1/followers/:userId/stats
 * Get follower stats
 */
followersRouter.get("/:userId/stats", followersController.getFollowerStats);

/**
 * GET /api/v1/followers/check/:userId
 * Check if following
 */
followersRouter.get(
  "/check/:userId",
  authenticateToken,
  followersController.isFollowing
);

import { Request, Response } from "express";
import { likesService } from "./likes.service";

const parseId = (id: any): number => {
  if (Array.isArray(id)) return parseInt(id[0]);
  if (typeof id === "string") return parseInt(id);
  return parseInt(String(id));
};

const parseQueryInt = (val: any, defaultVal: number = 0): number => {
  if (Array.isArray(val)) return parseInt(val[0]) || defaultVal;
  if (typeof val === "string") return parseInt(val) || defaultVal;
  return defaultVal;
};

export class LikesController {
  /**
   * Like a post or comment
   * POST /api/v1/likes
   * Body: { postId?: number, commentId?: number }
   */
  async createLike(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { postId, commentId } = req.body;

      const like = await likesService.createLike({
        userId,
        postId,
        commentId,
      });

      res.status(201).json({ success: true, data: like });
    } catch (error: any) {
      if (error.message.includes("not found")) {
        res.status(404).json({ success: false, error: error.message });
      } else if (error.message.includes("Already liked")) {
        res.status(400).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }

  /**
   * Unlike a post or comment
   * DELETE /api/v1/likes?postId=1 or DELETE /api/v1/likes?commentId=1
   */
  async deleteLike(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { postId, commentId } = req.query;

      await likesService.deleteLike(
        userId,
        postId ? parseId(postId) : undefined,
        commentId ? parseId(commentId) : undefined
      );

      res.json({ success: true, message: "Like removed successfully" });
    } catch (error: any) {
      if (error.message.includes("not found")) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }

  /**
   * Check if user liked something
   * GET /api/v1/likes/check?postId=1 or ?commentId=1
   */
  async checkLike(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { postId, commentId } = req.query;

      const liked = await likesService.userLiked(
        userId,
        postId ? parseId(postId) : undefined,
        commentId ? parseId(commentId) : undefined
      );

      res.json({ success: true, data: { liked } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get users who liked a post
   * GET /api/v1/likes/post/:postId?limit=20&offset=0
   */
  async getPostLikes(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const { limit, offset } = req.query;

      const likesList = await likesService.getPostLikes(
        parseId(postId),
        parseQueryInt(limit, 20),
        parseQueryInt(offset, 0)
      );

      res.json({ success: true, data: likesList, count: likesList.length });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get users who liked a comment
   * GET /api/v1/likes/comment/:commentId?limit=20&offset=0
   */
  async getCommentLikes(req: Request, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const { limit, offset } = req.query;

      const likesList = await likesService.getCommentLikes(
        parseId(commentId),
        parseQueryInt(limit, 20),
        parseQueryInt(offset, 0)
      );

      res.json({ success: true, data: likesList, count: likesList.length });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get like stats for post or comment
   * GET /api/v1/likes/stats?postId=1 or ?commentId=1
   */
  async getLikeStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { postId, commentId } = req.query;

      const stats = await likesService.getLikeStats(
        userId,
        postId ? parseId(postId) : undefined,
        commentId ? parseId(commentId) : undefined
      );

      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get all likes by current user
   * GET /api/v1/likes/user?limit=50&offset=0
   */
  async getUserLikes(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { limit, offset } = req.query;

      const userLikes = await likesService.getUserLikes(
        userId,
        parseQueryInt(limit, 50),
        parseQueryInt(offset, 0)
      );

      res.json({ success: true, data: userLikes, count: userLikes.length });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Toggle like (like if not liked, unlike if liked)
   * POST /api/v1/likes/toggle
   * Body: { postId?: number, commentId?: number }
   */
  async toggleLike(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { postId, commentId } = req.body;

      const isNowLiked = await likesService.toggleLike(userId, postId, commentId);

      res.json({
        success: true,
        data: { liked: isNowLiked },
        message: isNowLiked ? "Liked successfully" : "Unliked successfully",
      });
    } catch (error: any) {
      if (error.message.includes("not found")) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }
}

export const likesController = new LikesController();

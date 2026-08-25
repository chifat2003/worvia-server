import { Request, Response } from "express";
import { postsService } from "./posts.service";

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

export class PostsController {
  /**
   * Create a new post
   * POST /api/v1/posts
   */
  async createPost(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { content, contentHtml, image, visibility } = req.body;

      if (!content || content.trim().length === 0) {
        res.status(400).json({ success: false, error: "Content is required" });
        return;
      }

      const post = await postsService.createPost({
        userId,
        content,
        contentHtml,
        image,
        visibility,
      });

      res.status(201).json({ success: true, data: post });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get post by ID
   * GET /api/v1/posts/:id
   */
  async getPost(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const post = await postsService.getPostWithAuthor(parseId(id));
      res.json({ success: true, data: post });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  }

  /**
   * Get all public posts with pagination
   * GET /api/v1/posts?limit=20&offset=0&sortBy=recent
   */
  async getPosts(req: Request, res: Response): Promise<void> {
    try {
      const { limit, offset, sortBy } = req.query;

      const posts = await postsService.getPosts({
        limit: parseQueryInt(limit, 20),
        offset: parseQueryInt(offset, 0),
        sortBy: (Array.isArray(sortBy) ? sortBy[0] : String(sortBy || "recent")) as "recent" | "engagement",
      });

      res.json({ success: true, data: posts, count: posts.length });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get posts by user ID
   * GET /api/v1/posts/user/:userId
   */
  async getPostsByUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { limit, offset } = req.query;

      const userPosts = await postsService.getPostsByUserId(parseId(userId), {
        limit: parseQueryInt(limit, 20),
        offset: parseQueryInt(offset, 0),
      });

      res.json({ success: true, data: userPosts, count: userPosts.length });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get user's feed (posts from connections and followed users)
   * GET /api/v1/posts/feed/personalized
   */
  async getUserFeed(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { limit, offset, sortBy } = req.query;

      const feed = await postsService.getUserFeed(userId, {
        limit: parseQueryInt(limit, 20),
        offset: parseQueryInt(offset, 0),
        sortBy: (Array.isArray(sortBy) ? sortBy[0] : String(sortBy || "recent")) as "recent" | "engagement",
      });

      res.json({ success: true, data: feed, count: feed.length });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Update post
   * PUT /api/v1/posts/:id
   */
  async updatePost(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { content, contentHtml, image, visibility } = req.body;

      const updatedPost = await postsService.updatePost(parseId(id), userId, {
        content,
        contentHtml,
        image,
        visibility,
      });

      res.json({ success: true, data: updatedPost });
    } catch (error: any) {
      if (error.message.includes("Unauthorized")) {
        res.status(403).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }

  /**
   * Delete post
   * DELETE /api/v1/posts/:id
   */
  async deletePost(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      await postsService.deletePost(parseId(id), userId);

      res.json({ success: true, message: "Post deleted successfully" });
    } catch (error: any) {
      if (error.message.includes("Unauthorized")) {
        res.status(403).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }

  /**
   * Get engagement metrics for a post
   * GET /api/v1/posts/:id/metrics
   */
  async getEngagementMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const metrics = await postsService.getEngagementMetrics(parseId(id));
      res.json({ success: true, data: metrics });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  }
}

export const postsController = new PostsController();

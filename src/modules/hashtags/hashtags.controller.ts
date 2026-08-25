import { Request, Response } from "express";
import { hashtagsService } from "./hashtags.service";

const parseQueryInt = (val: any, defaultVal: number = 0): number => {
  if (Array.isArray(val)) return parseInt(val[0]) || defaultVal;
  if (typeof val === "string") return parseInt(val) || defaultVal;
  return defaultVal;
};

const parseQueryStr = (val: any, defaultVal: string = ""): string => {
  if (Array.isArray(val)) return String(val[0]) || defaultVal;
  return String(val) || defaultVal;
};

export class HashtagsController {
  /**
   * Search hashtags
   * GET /api/v1/hashtags/search?query=tech&limit=20
   */
  async searchHashtags(req: Request, res: Response): Promise<void> {
    try {
      const { query, limit } = req.query;

      if (!query) {
        res.status(400).json({ success: false, error: "Query is required" });
        return;
      }

      const hashtags = await hashtagsService.searchHashtags(parseQueryStr(query), parseQueryInt(limit, 20));

      res.json({ success: true, data: hashtags, count: hashtags.length });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get trending hashtags
   * GET /api/v1/hashtags/trending?limit=10
   */
  async getTrendingHashtags(req: Request, res: Response): Promise<void> {
    try {
      const { limit } = req.query;

      const trends = await hashtagsService.getTrendingHashtags(parseQueryInt(limit, 10));

      res.json({ success: true, data: trends, count: trends.length });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get hashtag by name
   * GET /api/v1/hashtags/:tag
   */
  async getHashtag(req: Request, res: Response): Promise<void> {
    try {
      const { tag } = req.params;
      const hashtag = await hashtagsService.getHashtag(parseQueryStr(tag));

      if (!hashtag) {
        res.status(404).json({ success: false, error: "Hashtag not found" });
        return;
      }

      res.json({ success: true, data: hashtag });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get posts with a specific hashtag
   * GET /api/v1/hashtags/:tag/posts?limit=20&offset=0
   */
  async getPostsByHashtag(req: Request, res: Response): Promise<void> {
    try {
      const { tag } = req.params;
      const { limit, offset } = req.query;

      const tagPosts = await hashtagsService.getPostsByHashtag(
        parseQueryStr(tag),
        parseQueryInt(limit, 20),
        parseQueryInt(offset, 0)
      );

      res.json({ success: true, data: tagPosts, count: tagPosts.length });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get hashtags for a post
   * GET /api/v1/hashtags/post/:postId
   */
  async getPostHashtags(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const tags = await hashtagsService.getPostHashtags(
        parseInt(Array.isArray(postId) ? postId[0] : postId)
      );

      res.json({ success: true, data: tags, count: tags.length });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Calculate trends (manual trigger for maintenance)
   * POST /api/v1/hashtags/trends/calculate
   */
  async calculateTrends(req: Request, res: Response): Promise<void> {
    try {
      await hashtagsService.calculateTrends();
      res.json({ success: true, message: "Trends calculated successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const hashtagsController = new HashtagsController();

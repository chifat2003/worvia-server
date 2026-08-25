import { Request, Response } from "express";
import { feedService } from "./feed.service";

const parseQueryInt = (val: any, defaultVal: number = 0): number => {
  if (Array.isArray(val)) return parseInt(val[0]) || defaultVal;
  if (typeof val === "string") return parseInt(val) || defaultVal;
  return defaultVal;
};

const parseQueryStr = (val: any, defaultVal: string = ""): string => {
  if (Array.isArray(val)) return String(val[0]) || defaultVal;
  return String(val) || defaultVal;
};

export class FeedController {
  /**
   * Get personalized feed for user
   * GET /api/v1/feed/personalized?limit=20&offset=0&algorithm=hybrid&timeWindow=168
   */
  async getPersonalizedFeed(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { limit, offset, algorithm, timeWindow } = req.query;

      const feed = await feedService.getPersonalizedFeed({
        userId,
        limit: parseQueryInt(limit, 20),
        offset: parseQueryInt(offset, 0),
        algorithm: (parseQueryStr(algorithm, "hybrid") as "engagement" | "recency" | "hybrid"),
        timeWindow: parseQueryInt(timeWindow, 168),
      });

      res.json({ success: true, data: feed, count: feed.length });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get discovery feed (trending, high-engagement content)
   * GET /api/v1/feed/discovery?limit=20&offset=0
   */
  async getDiscoveryFeed(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { limit, offset } = req.query;

      const feed = await feedService.getDiscoveryFeed(
        userId,
        parseQueryInt(limit, 20),
        parseQueryInt(offset, 0)
      );

      res.json({ success: true, data: feed, count: feed.length });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get feed for specific hashtag
   * GET /api/v1/feed/hashtag/:tag?limit=20&offset=0
   */
  async getHashtagFeed(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { tag } = req.params;
      const { limit, offset } = req.query;

      const feed = await feedService.getHashtagFeed(
        parseQueryStr(tag),
        userId,
        parseQueryInt(limit, 20),
        parseQueryInt(offset, 0)
      );

      res.json({ success: true, data: feed, count: feed.length });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get ranking metrics for a post (debugging/analytics)
   * GET /api/v1/feed/metrics/:postId
   */
  async getRankingMetrics(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { postId } = req.params;

      const metrics = await feedService.getRankingMetrics(
        parseInt(Array.isArray(postId) ? postId[0] : postId),
        userId
      );

      res.json({ success: true, data: metrics });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  }
}

export const feedController = new FeedController();

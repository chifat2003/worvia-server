import { Router } from "express";
import { feedController } from "./feed.controller";
import { authenticateToken } from "../../middleware/auth.middleware";

const router = Router();

// All feed routes require authentication
router.get("/personalized", authenticateToken, feedController.getPersonalizedFeed.bind(feedController));
router.get("/discovery", authenticateToken, feedController.getDiscoveryFeed.bind(feedController));
router.get("/hashtag/:tag", authenticateToken, feedController.getHashtagFeed.bind(feedController));
router.get("/metrics/:postId", authenticateToken, feedController.getRankingMetrics.bind(feedController));

export default router;

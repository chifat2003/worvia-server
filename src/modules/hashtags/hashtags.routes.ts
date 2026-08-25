import { Router } from "express";
import { hashtagsController } from "./hashtags.controller";
import { authenticateToken } from "../../middleware/auth.middleware";

const router = Router();

// Public routes
router.get("/search", hashtagsController.searchHashtags.bind(hashtagsController));
router.get("/trending", hashtagsController.getTrendingHashtags.bind(hashtagsController));
router.get("/:tag", hashtagsController.getHashtag.bind(hashtagsController));
router.get("/:tag/posts", hashtagsController.getPostsByHashtag.bind(hashtagsController));
router.get("/post/:postId", hashtagsController.getPostHashtags.bind(hashtagsController));

// Protected/Admin routes
router.post("/trends/calculate", authenticateToken, hashtagsController.calculateTrends.bind(hashtagsController));

export default router;

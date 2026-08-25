import { Router } from "express";
import { postsController } from "./posts.controller";
import { authenticateToken } from "../../middleware/auth.middleware";

const router = Router();

// Public routes
router.get("/", postsController.getPosts.bind(postsController));
router.get("/:id", postsController.getPost.bind(postsController));
router.get("/:id/metrics", postsController.getEngagementMetrics.bind(postsController));
router.get("/user/:userId", postsController.getPostsByUser.bind(postsController));

// Protected routes
router.post("/", authenticateToken, postsController.createPost.bind(postsController));
router.put("/:id", authenticateToken, postsController.updatePost.bind(postsController));
router.delete("/:id", authenticateToken, postsController.deletePost.bind(postsController));
router.get("/feed/personalized", authenticateToken, postsController.getUserFeed.bind(postsController));

export default router;

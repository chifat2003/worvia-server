import { Router } from "express";
import { likesController } from "./likes.controller";
import { authenticateToken } from "../../middleware/auth.middleware";

const router = Router();

// Public routes
router.get("/post/:postId", likesController.getPostLikes.bind(likesController));
router.get("/comment/:commentId", likesController.getCommentLikes.bind(likesController));

// Protected routes
router.post("/", authenticateToken, likesController.createLike.bind(likesController));
router.delete("/", authenticateToken, likesController.deleteLike.bind(likesController));
router.get("/check", authenticateToken, likesController.checkLike.bind(likesController));
router.get("/stats", authenticateToken, likesController.getLikeStats.bind(likesController));
router.get("/user", authenticateToken, likesController.getUserLikes.bind(likesController));
router.post("/toggle", authenticateToken, likesController.toggleLike.bind(likesController));

export default router;

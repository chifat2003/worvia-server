import { Router } from "express";
import { commentsController } from "./comments.controller";
import { authenticateToken } from "../../middleware/auth.middleware";

const router = Router();

// Public routes
router.get("/post/:postId", commentsController.getPostComments.bind(commentsController));
router.get("/post/:postId/threaded", commentsController.getPostCommentsThreaded.bind(commentsController));
router.get("/:id", commentsController.getComment.bind(commentsController));
router.get("/:commentId/replies", commentsController.getCommentReplies.bind(commentsController));
router.get("/:commentId/thread", commentsController.getCommentThread.bind(commentsController));
router.get("/search", commentsController.searchPostComments.bind(commentsController));

// Protected routes
router.post("/", authenticateToken, commentsController.createComment.bind(commentsController));
router.put("/:id", authenticateToken, commentsController.updateComment.bind(commentsController));
router.delete("/:id", authenticateToken, commentsController.deleteComment.bind(commentsController));

export default router;

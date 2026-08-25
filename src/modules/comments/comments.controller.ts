import { Request, Response } from "express";
import { commentsService } from "./comments.service";

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

export class CommentsController {
  /**
   * Create a new comment
   * POST /api/v1/comments
   */
  async createComment(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { postId, content, contentHtml, parentCommentId } = req.body;

      if (!content || content.trim().length === 0) {
        res.status(400).json({ success: false, error: "Content is required" });
        return;
      }

      if (!postId) {
        res.status(400).json({ success: false, error: "Post ID is required" });
        return;
      }

      const comment = await commentsService.createComment({
        postId,
        userId,
        content,
        contentHtml,
        parentCommentId,
      });

      res.status(201).json({ success: true, data: comment });
    } catch (error: any) {
      if (error.message.includes("not found")) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }

  /**
   * Get comment by ID
   * GET /api/v1/comments/:id
   */
  async getComment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const comment = await commentsService.getCommentWithAuthor(parseId(id));
      res.json({ success: true, data: comment });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  }

  /**
   * Get all top-level comments for a post
   * GET /api/v1/comments/post/:postId?limit=20&offset=0
   */
  async getPostComments(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const { limit, offset } = req.query;

      const postComments = await commentsService.getPostComments({
        postId: parseId(postId),
        parentCommentId: null,
        limit: parseQueryInt(limit, 20),
        offset: parseQueryInt(offset, 0),
      });

      res.json({ success: true, data: postComments, count: postComments.length });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get all comments for a post with nested replies (threaded)
   * GET /api/v1/comments/post/:postId/threaded?limit=20&offset=0
   */
  async getPostCommentsThreaded(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const { limit, offset } = req.query;

      const threads = await commentsService.getPostCommentsThreaded(
        parseId(postId),
        parseQueryInt(limit, 20),
        parseQueryInt(offset, 0)
      );

      res.json({ success: true, data: threads, count: threads.length });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get replies to a comment
   * GET /api/v1/comments/:commentId/replies?limit=10&offset=0
   */
  async getCommentReplies(req: Request, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const { limit, offset } = req.query;

      const replies = await commentsService.getCommentReplies(
        parseId(commentId),
        parseQueryInt(limit, 10),
        parseQueryInt(offset, 0)
      );

      res.json({ success: true, data: replies, count: replies.length });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get full comment thread (including nested replies)
   * GET /api/v1/comments/:commentId/thread
   */
  async getCommentThread(req: Request, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const thread = await commentsService.getCommentThread(parseId(commentId));
      res.json({ success: true, data: thread });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  }

  /**
   * Update comment
   * PUT /api/v1/comments/:id
   */
  async updateComment(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { content, contentHtml } = req.body;

      const updatedComment = await commentsService.updateComment(parseId(id), userId, {
        content,
        contentHtml,
      });

      res.json({ success: true, data: updatedComment });
    } catch (error: any) {
      if (error.message.includes("Unauthorized")) {
        res.status(403).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }

  /**
   * Delete comment
   * DELETE /api/v1/comments/:id
   */
  async deleteComment(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      await commentsService.deleteComment(parseId(id), userId);

      res.json({ success: true, message: "Comment deleted successfully" });
    } catch (error: any) {
      if (error.message.includes("Unauthorized")) {
        res.status(403).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }

  /**
   * Search comments in a post
   * GET /api/v1/comments/search?postId=1&query=hello&limit=20
   */
  async searchPostComments(req: Request, res: Response): Promise<void> {
    try {
      const { postId, query, limit } = req.query;

      if (!postId || !query) {
        res.status(400).json({ success: false, error: "postId and query are required" });
        return;
      }

      const results = await commentsService.searchPostComments(
        parseId(postId),
        String(query),
        parseQueryInt(limit, 20)
      );

      res.json({ success: true, data: results, count: results.length });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const commentsController = new CommentsController();

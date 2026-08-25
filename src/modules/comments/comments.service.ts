import { db } from "../../db/index";
import { comments, users, profiles, posts } from "../../db/schema";
import { eq, desc, and } from "drizzle-orm";
import {
  CreateCommentInput,
  UpdateCommentInput,
  CommentWithAuthor,
  CommentThread,
  CommentFilter,
} from "./comments.types";
import { postsService } from "../posts/posts.service";

export class CommentsService {
  /**
   * Create a new comment
   */
  async createComment(input: CreateCommentInput): Promise<CommentWithAuthor> {
    // Verify post exists
    const post = await db.select().from(posts).where(eq(posts.id, input.postId));
    if (!post.length) {
      throw new Error("Post not found");
    }

    // Verify parent comment exists if provided
    if (input.parentCommentId) {
      const parentComment = await db
        .select()
        .from(comments)
        .where(eq(comments.id, input.parentCommentId));
      if (!parentComment.length) {
        throw new Error("Parent comment not found");
      }
    }

    const [newComment] = await db
      .insert(comments)
      .values({
        postId: input.postId,
        userId: input.userId,
        parentCommentId: input.parentCommentId || null,
        content: input.content,
        contentHtml: input.contentHtml,
      })
      .returning();

    // Increment post comment count
    await postsService.incrementCommentCount(input.postId);

    return this.getCommentWithAuthor(newComment.id);
  }

  /**
   * Get comment by ID with author details
   */
  async getCommentWithAuthor(commentId: number): Promise<CommentWithAuthor> {
    const result = await db
      .select({
        comment: comments,
        author: {
          id: users.id,
          email: users.email,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          profilePhoto: profiles.profilePhoto,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(eq(comments.id, commentId));

    if (!result.length) {
      throw new Error("Comment not found");
    }

    const { comment: commentData, author } = result[0];
    return {
      ...commentData,
      contentHtml: commentData.contentHtml || undefined,
      author,
    } as CommentWithAuthor;
  }

  /**
   * Get all top-level comments for a post
   */
  async getPostComments(filter: CommentFilter): Promise<CommentWithAuthor[]> {
    const limit = filter.limit || 20;
    const offset = filter.offset || 0;

    const result = await db
      .select({
        comment: comments,
        author: {
          id: users.id,
          email: users.email,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          profilePhoto: profiles.profilePhoto,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(eq(comments.postId, filter.postId))
      .orderBy(desc(comments.createdAt))
      .limit(limit)
      .offset(offset);

    // Filter by parentCommentId in memory
    let filtered = result;
    if (filter.parentCommentId !== undefined) {
      filtered = result.filter(
        (r) =>
          (filter.parentCommentId === null && r.comment.parentCommentId === null) ||
          (filter.parentCommentId !== null && r.comment.parentCommentId === filter.parentCommentId)
      );
    } else {
      // Default: only top-level comments
      filtered = result.filter((r) => r.comment.parentCommentId === null);
    }

    return filtered.map(({ comment: commentData, author }) => ({
      ...commentData,
      contentHtml: commentData.contentHtml || undefined,
      author,
    } as CommentWithAuthor));
  }

  /**
   * Get replies to a specific comment
   */
  async getCommentReplies(parentCommentId: number, limit: number = 10, offset: number = 0): Promise<CommentWithAuthor[]> {
    const result = await db
      .select({
        comment: comments,
        author: {
          id: users.id,
          email: users.email,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          profilePhoto: profiles.profilePhoto,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(eq(comments.parentCommentId, parentCommentId))
      .orderBy(desc(comments.createdAt))
      .limit(limit)
      .offset(offset);

    return result.map(({ comment: commentData, author }) => ({
      ...commentData,
      contentHtml: commentData.contentHtml || undefined,
      author,
    } as CommentWithAuthor));
  }

  /**
   * Get full comment thread (comment + all nested replies recursively)
   */
  async getCommentThread(commentId: number): Promise<CommentWithAuthor> {
    const comment = await this.getCommentWithAuthor(commentId);

    // Get immediate replies
    const replies = await this.getCommentReplies(commentId, 100);

    // Recursively build threads for each reply
    const enrichedReplies = await Promise.all(
      replies.map(async (reply) => {
        const thread = await this.getCommentThread(reply.id);
        return thread;
      })
    );

    return {
      ...comment,
      replies: enrichedReplies,
    };
  }

  /**
   * Get all comments for a post with nested replies
   */
  async getPostCommentsThreaded(postId: number, limit: number = 20, offset: number = 0): Promise<CommentWithAuthor[]> {
    // Get top-level comments
    const topLevelComments = await this.getPostComments({
      postId,
      parentCommentId: null,
      limit,
      offset,
    });

    // Build threads for each comment
    const threads = await Promise.all(
      topLevelComments.map(async (comment) => {
        const replies = await this.getCommentReplies(comment.id, 100);
        return {
          ...comment,
          replies,
        };
      })
    );

    return threads;
  }

  /**
   * Update comment
   */
  async updateComment(commentId: number, userId: number, input: UpdateCommentInput): Promise<CommentWithAuthor> {
    // Verify ownership
    const comment = await db.select().from(comments).where(eq(comments.id, commentId));
    if (!comment.length || comment[0].userId !== userId) {
      throw new Error("Unauthorized: Cannot update this comment");
    }

    await db
      .update(comments)
      .set({
        content: input.content,
        contentHtml: input.contentHtml,
        updatedAt: new Date(),
      })
      .where(eq(comments.id, commentId));

    return this.getCommentWithAuthor(commentId);
  }

  /**
   * Delete comment
   */
  async deleteComment(commentId: number, userId: number): Promise<boolean> {
    // Verify ownership
    const comment = await db.select().from(comments).where(eq(comments.id, commentId));
    if (!comment.length || comment[0].userId !== userId) {
      throw new Error("Unauthorized: Cannot delete this comment");
    }

    const postId = comment[0].postId;

    // Delete the comment (this will cascade delete any replies due to foreign key)
    await db.delete(comments).where(eq(comments.id, commentId));

    // Decrement post comment count
    await postsService.decrementCommentCount(postId);

    return true;
  }

  /**
   * Increment like count on comment
   */
  async incrementLikeCount(commentId: number): Promise<void> {
    const [commentData] = await db.select().from(comments).where(eq(comments.id, commentId));
    if (!commentData) return;

    await db
      .update(comments)
      .set({
        likeCount: commentData.likeCount + 1,
      })
      .where(eq(comments.id, commentId));
  }

  /**
   * Decrement like count on comment
   */
  async decrementLikeCount(commentId: number): Promise<void> {
    const [commentData] = await db.select().from(comments).where(eq(comments.id, commentId));
    if (!commentData) return;

    await db
      .update(comments)
      .set({
        likeCount: Math.max(0, commentData.likeCount - 1),
      })
      .where(eq(comments.id, commentId));
  }

  /**
   * Get comment count for a post
   */
  async getPostCommentCount(postId: number): Promise<number> {
    const result = await db
      .select({ count: comments.id })
      .from(comments)
      .where(eq(comments.postId, postId));

    return result.length;
  }

  /**
   * Search comments by content (for a specific post)
   */
  async searchPostComments(postId: number, query: string, limit: number = 20): Promise<CommentWithAuthor[]> {
    // Simple in-memory search since Drizzle doesn't support ILIKE natively
    const allComments = await db
      .select({
        comment: comments,
        author: {
          id: users.id,
          email: users.email,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          profilePhoto: profiles.profilePhoto,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(eq(comments.postId, postId))
      .limit(1000); // Get reasonable amount and filter in memory

    const lowerQuery = query.toLowerCase();
    const filtered = allComments.filter(({ comment: c }) => c.content.toLowerCase().includes(lowerQuery)).slice(0, limit);

    return filtered.map(({ comment: commentData, author }) => ({
      ...commentData,
      contentHtml: commentData.contentHtml || undefined,
      author,
    } as CommentWithAuthor));
  }
}

export const commentsService = new CommentsService();

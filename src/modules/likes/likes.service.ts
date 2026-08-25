import { db } from "../../db/index";
import { likes, posts, comments } from "../../db/schema";
import { eq, and, count } from "drizzle-orm";
import { CreateLikeInput, LikeStats, UserLike } from "./likes.types";
import { postsService } from "../posts/posts.service";
import { commentsService } from "../comments/comments.service";

export class LikesService {
  /**
   * Like a post or comment
   */
  async createLike(input: CreateLikeInput): Promise<UserLike> {
    // Validate input
    if (!input.postId && !input.commentId) {
      throw new Error("Either postId or commentId must be provided");
    }

    if (input.postId && input.commentId) {
      throw new Error("Cannot like both post and comment at the same time");
    }

    // Check if post/comment exists
    if (input.postId) {
      const post = await db.select().from(posts).where(eq(posts.id, input.postId));
      if (!post.length) {
        throw new Error("Post not found");
      }
    }

    if (input.commentId) {
      const comment = await db.select().from(comments).where(eq(comments.id, input.commentId));
      if (!comment.length) {
        throw new Error("Comment not found");
      }
    }

    // Check if already liked (to prevent duplicates due to unique constraint)
    const existing = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.userId, input.userId),
          input.postId ? eq(likes.postId, input.postId) : eq(likes.commentId, input.commentId || 0)
        )
      );

    if (existing.length > 0) {
      throw new Error("Already liked this item");
    }

    // Create like
    const [newLike] = await db
      .insert(likes)
      .values({
        userId: input.userId,
        postId: input.postId || null,
        commentId: input.commentId || null,
      })
      .returning();

    // Update engagement metrics
    if (input.postId) {
      await postsService.incrementLikeCount(input.postId);
    } else if (input.commentId) {
      await commentsService.incrementLikeCount(input.commentId);
    }

    return newLike;
  }

  /**
   * Unlike a post or comment
   */
  async deleteLike(userId: number, postId?: number, commentId?: number): Promise<boolean> {
    // Validate input
    if (!postId && !commentId) {
      throw new Error("Either postId or commentId must be provided");
    }

    const whereCondition = and(
      eq(likes.userId, userId),
      postId ? eq(likes.postId, postId) : eq(likes.commentId, commentId || 0)
    );

    const likesToDelete = await db.select().from(likes).where(whereCondition);

    if (!likesToDelete.length) {
      throw new Error("Like not found");
    }

    // Delete like
    await db.delete(likes).where(whereCondition);

    // Update engagement metrics
    if (postId) {
      await postsService.decrementLikeCount(postId);
    } else if (commentId) {
      await commentsService.decrementLikeCount(commentId);
    }

    return true;
  }

  /**
   * Check if user liked a post or comment
   */
  async userLiked(userId: number, postId?: number, commentId?: number): Promise<boolean> {
    if (!postId && !commentId) {
      throw new Error("Either postId or commentId must be provided");
    }

    const result = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.userId, userId),
          postId ? eq(likes.postId, postId) : eq(likes.commentId, commentId || 0)
        )
      );

    return result.length > 0;
  }

  /**
   * Get all users who liked a post
   */
  async getPostLikes(postId: number, limit: number = 20, offset: number = 0): Promise<UserLike[]> {
    const result = await db
      .select()
      .from(likes)
      .where(eq(likes.postId, postId))
      .limit(limit)
      .offset(offset);

    return result;
  }

  /**
   * Get all users who liked a comment
   */
  async getCommentLikes(commentId: number, limit: number = 20, offset: number = 0): Promise<UserLike[]> {
    const result = await db
      .select()
      .from(likes)
      .where(eq(likes.commentId, commentId))
      .limit(limit)
      .offset(offset);

    return result;
  }

  /**
   * Get like count for a post
   */
  async getPostLikeCount(postId: number): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(likes)
      .where(eq(likes.postId, postId));

    return result[0]?.count || 0;
  }

  /**
   * Get like count for a comment
   */
  async getCommentLikeCount(commentId: number): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(likes)
      .where(eq(likes.commentId, commentId));

    return result[0]?.count || 0;
  }

  /**
   * Get like stats with user preference
   */
  async getLikeStats(userId: number, postId?: number, commentId?: number): Promise<LikeStats> {
    if (!postId && !commentId) {
      throw new Error("Either postId or commentId must be provided");
    }

    let likeCount = 0;
    if (postId) {
      likeCount = await this.getPostLikeCount(postId);
    } else if (commentId) {
      likeCount = await this.getCommentLikeCount(commentId);
    }

    const userLiked = await this.userLiked(userId, postId, commentId);

    return {
      postId,
      commentId,
      likeCount,
      userLiked,
    };
  }

  /**
   * Get all likes by a user
   */
  async getUserLikes(userId: number, limit: number = 50, offset: number = 0): Promise<UserLike[]> {
    const result = await db
      .select()
      .from(likes)
      .where(eq(likes.userId, userId))
      .limit(limit)
      .offset(offset);

    return result;
  }

  /**
   * Get all posts liked by a user
   */
  async getUserLikedPosts(userId: number, limit: number = 20, offset: number = 0): Promise<UserLike[]> {
    const result = await db
      .select()
      .from(likes)
      .where(eq(likes.userId, userId))
      .limit(limit)
      .offset(offset);

    // Filter in memory to get only post likes
    return result.filter((l) => l.postId !== null);
  }

  /**
   * Toggle like (like if not liked, unlike if liked)
   */
  async toggleLike(userId: number, postId?: number, commentId?: number): Promise<boolean> {
    const isLiked = await this.userLiked(userId, postId, commentId);

    if (isLiked) {
      await this.deleteLike(userId, postId, commentId);
      return false; // Now unliked
    } else {
      await this.createLike({ userId, postId, commentId });
      return true; // Now liked
    }
  }
}

export const likesService = new LikesService();

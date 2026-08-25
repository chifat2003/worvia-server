import { db } from "../../db/index";
import { posts, comments, likes, profiles, users, followers } from "../../db/schema";
import { eq, desc, and, or, inArray } from "drizzle-orm";
import {
  CreatePostInput,
  UpdatePostInput,
  PostWithAuthor,
  PostEngagementMetrics,
  PostFeedFilter,
} from "./posts.types";

export class PostsService {
  /**
   * Create a new post
   */
  async createPost(input: CreatePostInput): Promise<PostWithAuthor> {
    try {
      const userId = typeof input.userId === 'string' ? parseInt(input.userId, 10) : input.userId;
      
      console.log("📌 PostsService.createPost - userId:", userId, "type:", typeof userId);

      // Direct insert with all fields specified
      const result = await db
        .insert(posts)
        .values({
          userId: userId,
          content: input.content,
          contentHtml: input.contentHtml || undefined,
          image: input.image || undefined,
          visibility: input.visibility || "public",
        })
        .returning();

      if (!result || result.length === 0) {
        throw new Error("Failed to insert post - no result returned");
      }

      const post = result[0];
      console.log("✅ Post created successfully! ID:", post.id, "by user:", post.userId);

      return this.getPostWithAuthor(post.id);
    } catch (error: any) {
      console.error("❌ Error in createPost:", error.message);
      throw new Error(`Failed to create post: ${error.message}`);
    }
  }

  /**
   * Get post by ID with author details
   */
  async getPostWithAuthor(postId: number): Promise<PostWithAuthor> {
    const result = await db
      .select({
        post: posts,
        author: {
          id: users.id,
          email: users.email,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          profilePhoto: profiles.profilePhoto,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(eq(posts.id, postId));

    if (!result.length) {
      throw new Error("Post not found");
    }

    const { post: postData, author } = result[0];
    return {
      ...postData,
      author: author,
    } as PostWithAuthor;
  }

  /**
   * Get all posts with pagination
   */
  async getPosts(filter: PostFeedFilter): Promise<PostWithAuthor[]> {
    const limit = filter.limit || 20;
    const offset = filter.offset || 0;
    const sortBy = filter.sortBy || "recent";

    const orderColumn = sortBy === "engagement" ? desc(posts.engagementScore) : desc(posts.createdAt);

    const result = await db
      .select({
        post: posts,
        author: {
          id: users.id,
          email: users.email,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          profilePhoto: profiles.profilePhoto,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(eq(posts.visibility, filter.visibility || "public"))
      .orderBy(orderColumn, desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    return result.map(({ post: postData, author }) => ({
      ...postData,
      author,
    } as PostWithAuthor));
  }

  /**
   * Get posts by user ID
   */
  async getPostsByUserId(userId: number, filter?: PostFeedFilter): Promise<PostWithAuthor[]> {
    const limit = filter?.limit || 20;
    const offset = filter?.offset || 0;

    const result = await db
      .select({
        post: posts,
        author: {
          id: users.id,
          email: users.email,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          profilePhoto: profiles.profilePhoto,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    return result.map(({ post: postData, author }) => ({
      ...postData,
      author,
    } as PostWithAuthor));
  }

  /**
   * Get feed for a user (posts from connections and followed users)
   */
  async getUserFeed(userId: number, filter?: PostFeedFilter): Promise<PostWithAuthor[]> {
    const limit = filter?.limit || 20;
    const offset = filter?.offset || 0;
    const sortBy = filter?.sortBy || "recent";

    // Get user's following
    const followingResult = await db
      .select({ userId: followers.followingId })
      .from(followers)
      .where(eq(followers.followerId, userId));

    const followingUserIds = followingResult.map((f) => f.userId);
    const feedUserIds = [...new Set([userId, ...followingUserIds])];

    if (feedUserIds.length === 0) {
      return [];
    }

    const orderColumn = sortBy === "engagement" ? desc(posts.engagementScore) : desc(posts.createdAt);

    const result = await db
      .select({
        post: posts,
        author: {
          id: users.id,
          email: users.email,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          profilePhoto: profiles.profilePhoto,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(
        and(
          inArray(posts.userId, feedUserIds),
          or(
            eq(posts.visibility, "public"),
            eq(posts.visibility, "connections"),
            eq(posts.userId, userId)
          )
        )
      )
      .orderBy(orderColumn, desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    return result.map(({ post: postData, author }) => ({
      ...postData,
      author,
    } as PostWithAuthor));
  }

  /**
   * Update post
   */
  async updatePost(postId: number, userId: number, input: UpdatePostInput): Promise<PostWithAuthor> {
    // Verify ownership
    const post = await db.select().from(posts).where(eq(posts.id, postId));
    if (!post.length || post[0].userId !== userId) {
      throw new Error("Unauthorized: Cannot update this post");
    }

    await db
      .update(posts)
      .set({
        content: input.content,
        contentHtml: input.contentHtml,
        image: input.image,
        visibility: input.visibility,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId));

    return this.getPostWithAuthor(postId);
  }

  /**
   * Delete post
   */
  async deletePost(postId: number, userId: number): Promise<boolean> {
    // Verify ownership
    const post = await db.select().from(posts).where(eq(posts.id, postId));
    if (!post.length || post[0].userId !== userId) {
      throw new Error("Unauthorized: Cannot delete this post");
    }

    const result = await db.delete(posts).where(eq(posts.id, postId));
    return true;
  }

  /**
   * Update engagement metrics
   * engagement_score = (likes × 2) + (comments × 3) + (shares × 5)
   */
  async updateEngagementScore(postId: number): Promise<void> {
    const [postData] = await db.select().from(posts).where(eq(posts.id, postId));

    if (!postData) {
      return;
    }

    const engagementScore = postData.likeCount * 2 + postData.commentCount * 3 + postData.shareCount * 5;

    await db.update(posts).set({ engagementScore }).where(eq(posts.id, postId));
  }

  /**
   * Increment like count
   */
  async incrementLikeCount(postId: number): Promise<void> {
    const [postData] = await db.select().from(posts).where(eq(posts.id, postId));
    if (!postData) return;

    await db
      .update(posts)
      .set({
        likeCount: postData.likeCount + 1,
      })
      .where(eq(posts.id, postId));

    await this.updateEngagementScore(postId);
  }

  /**
   * Decrement like count
   */
  async decrementLikeCount(postId: number): Promise<void> {
    const [postData] = await db.select().from(posts).where(eq(posts.id, postId));
    if (!postData) return;

    await db
      .update(posts)
      .set({
        likeCount: Math.max(0, postData.likeCount - 1),
      })
      .where(eq(posts.id, postId));

    await this.updateEngagementScore(postId);
  }

  /**
   * Increment comment count
   */
  async incrementCommentCount(postId: number): Promise<void> {
    const [postData] = await db.select().from(posts).where(eq(posts.id, postId));
    if (!postData) return;

    await db
      .update(posts)
      .set({
        commentCount: postData.commentCount + 1,
      })
      .where(eq(posts.id, postId));

    await this.updateEngagementScore(postId);
  }

  /**
   * Decrement comment count
   */
  async decrementCommentCount(postId: number): Promise<void> {
    const [postData] = await db.select().from(posts).where(eq(posts.id, postId));
    if (!postData) return;

    await db
      .update(posts)
      .set({
        commentCount: Math.max(0, postData.commentCount - 1),
      })
      .where(eq(posts.id, postId));

    await this.updateEngagementScore(postId);
  }

  /**
   * Increment share count
   */
  async incrementShareCount(postId: number): Promise<void> {
    const [postData] = await db.select().from(posts).where(eq(posts.id, postId));
    if (!postData) return;

    await db
      .update(posts)
      .set({
        shareCount: postData.shareCount + 1,
      })
      .where(eq(posts.id, postId));

    await this.updateEngagementScore(postId);
  }

  /**
   * Get engagement metrics
   */
  async getEngagementMetrics(postId: number): Promise<PostEngagementMetrics> {
    const [postData] = await db.select().from(posts).where(eq(posts.id, postId));

    if (!postData) {
      throw new Error("Post not found");
    }

    return {
      postId,
      likeCount: postData.likeCount,
      commentCount: postData.commentCount,
      shareCount: postData.shareCount,
      engagementScore: postData.engagementScore,
    };
  }
}

export const postsService = new PostsService();

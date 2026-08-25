import { db } from "../../db/index";
import { posts, users, profiles, followers, likes, postHashtags, hashtags } from "../../db/schema";
import { eq, desc, and, inArray, gte } from "drizzle-orm";
import { FeedPost, FeedOptions, FeedRankingMetrics } from "./feed.types";
import { postsService } from "../posts/posts.service";
import { likesService } from "../likes/likes.service";
import { hashtagsService } from "../hashtags/hashtags.service";

export class FeedService {
  /**
   * Calculate recency score (posts from last N hours weighted)
   */
  private calculateRecencyScore(createdAt: Date): number {
    const now = new Date();
    const ageInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    // Linear decay: 1 if posted now, 0.5 if posted 24h ago, 0 if posted 7+ days ago
    const decayFactor = Math.max(0, 1 - ageInHours / (7 * 24));
    return decayFactor * 100;
  }

  /**
   * Calculate personalization score
   * Factors: user follows author, shared interests/hashtags, mutual connections
   */
  private async calculatePersonalizationScore(userId: number, authorId: number): Promise<number> {
    let score = 0;

    // Check if user follows the author
    const follows = await db
      .select()
      .from(followers)
      .where(and(eq(followers.followerId, userId), eq(followers.followingId, authorId)));

    if (follows.length > 0) {
      score += 50; // User follows author
    }

    return score;
  }

  /**
   * Calculate composite feed ranking score
   * hybrid = (engagementScore * 0.4) + (recencyScore * 0.3) + (personalizationScore * 0.3)
   */
  private async calculateFeedScore(post: any, userId: number, algorithm: "engagement" | "recency" | "hybrid"): Promise<number> {
    const engagementScore = post.engagementScore || 0;
    const recencyScore = this.calculateRecencyScore(post.createdAt);
    const personalizationScore = await this.calculatePersonalizationScore(userId, post.userId);

    switch (algorithm) {
      case "engagement":
        return engagementScore;
      case "recency":
        return recencyScore;
      case "hybrid":
      default:
        return engagementScore * 0.4 + recencyScore * 0.3 + personalizationScore * 0.3;
    }
  }

  /**
   * Helper to build author object safely
   */
  private buildAuthor(data: any): FeedPost["author"] | undefined {
    if (!data || !data.id) return undefined;
    return {
      id: data.id as number,
      email: (data.email || "") as string,
      firstName: data.firstName || undefined,
      lastName: data.lastName || undefined,
      profilePhoto: data.profilePhoto || undefined,
    };
  }

  /**
   * Get personalized feed for user
   * Includes posts from: followed users, user's own posts, public posts with high engagement
   */
  async getPersonalizedFeed(options: FeedOptions): Promise<FeedPost[]> {
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    const algorithm = options.algorithm || "hybrid";
    const timeWindow = options.timeWindow || 168; // 7 days

    // Get user's following list
    const followingResult = await db
      .select({ userId: followers.followingId })
      .from(followers)
      .where(eq(followers.followerId, options.userId));

    const followingIds = followingResult.map((f) => f.userId);
    const feedUserIds = [...new Set([options.userId, ...followingIds])];

    if (feedUserIds.length === 0) {
      return [];
    }

    const timeWindowHours = timeWindow;
    const cutoffDate = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);

    // Get posts from feed users within time window
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
          gte(posts.createdAt, cutoffDate),
          eq(posts.visibility, "public")
        )
      );

    // Calculate scores and sort
    const scored = await Promise.all(
      result.map(async ({ post: postData, author }) => {
        const score = await this.calculateFeedScore(postData, options.userId, algorithm);
        return {
          post: postData,
          author,
          score,
        };
      })
    );

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Get user's likes for context
    const userLikes = new Set<number>();
    const userLikesResult = await likesService.getUserLikes(options.userId, 1000);
    userLikesResult.forEach((like) => {
      if (like.postId) userLikes.add(like.postId);
    });

    // Get hashtags for each post
    const feedPosts: FeedPost[] = [];
    for (let i = offset; i < offset + limit && i < scored.length; i++) {
      const { post: postData, author } = scored[i];
      if (!postData) continue;

      const postTags = await hashtagsService.getPostHashtags(postData.id);

      feedPosts.push({
        ...postData,
        contentHtml: postData.contentHtml || undefined,
        author: this.buildAuthor(author),
        isLikedByUser: userLikes.has(postData.id),
        hashtags: postTags.map((t) => t.tag),
      });
    }

    return feedPosts;
  }

  /**
   * Get discovery feed (trending posts, recommended users' content)
   */
  async getDiscoveryFeed(userId: number, limit: number = 20, offset: number = 0): Promise<FeedPost[]> {
    const cutoffDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000); // Last 14 days

    // Get high-engagement posts user hasn't seen
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
          eq(posts.visibility, "public"),
          gte(posts.createdAt, cutoffDate)
        )
      )
      .orderBy(desc(posts.engagementScore))
      .limit(limit * 3) // Get 3x to filter
      .offset(0);

    // Filter out posts from users already followed and user's own posts
    const following = await db
      .select({ followingId: followers.followingId })
      .from(followers)
      .where(eq(followers.followerId, userId));

    const followingIds = new Set(following.map((f) => f.followingId));
    followingIds.add(userId); // Exclude own posts

    const filtered = result.filter((r) => r.post && !followingIds.has(r.post.userId)).slice(0, limit + offset);

    // Get hashtags for each post
    const feedPosts: FeedPost[] = [];
    for (let i = offset; i < offset + limit && i < filtered.length; i++) {
      const { post: postData, author } = filtered[i];
      if (!postData) continue;

      const postTags = await hashtagsService.getPostHashtags(postData.id);

      feedPosts.push({
        ...postData,
        contentHtml: postData.contentHtml || undefined,
        author: this.buildAuthor(author),
        hashtags: postTags.map((t) => t.tag),
      });
    }

    return feedPosts;
  }

  /**
   * Get feed for a specific hashtag
   */
  async getHashtagFeed(tag: string, userId: number, limit: number = 20, offset: number = 0): Promise<FeedPost[]> {
    const postList = await hashtagsService.getPostsByHashtag(tag, 1000, 0);

    // Sort by engagement
    postList.sort((a, b) => {
      const aScore = a && a.engagementScore ? a.engagementScore : 0;
      const bScore = b && b.engagementScore ? b.engagementScore : 0;
      return bScore - aScore;
    });

    // Get user's likes
    const userLikes = new Set<number>();
    const userLikesResult = await likesService.getUserLikes(userId, 1000);
    userLikesResult.forEach((like) => {
      if (like.postId) userLikes.add(like.postId);
    });

    // Build feed posts with author info
    const feedPosts: FeedPost[] = [];
    for (let i = offset; i < offset + limit && i < postList.length; i++) {
      const postData = postList[i];
      if (!postData) continue;

      const authorResult = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          profilePhoto: profiles.profilePhoto,
        })
        .from(users)
        .leftJoin(profiles, eq(users.id, profiles.userId))
        .where(eq(users.id, postData.userId));

      const postTags = await hashtagsService.getPostHashtags(postData.id);

      feedPosts.push({
        ...postData,
        contentHtml: postData.contentHtml || undefined,
        author: this.buildAuthor(authorResult[0]),
        isLikedByUser: userLikes.has(postData.id),
        hashtags: postTags.map((t) => t.tag),
      });
    }

    return feedPosts;
  }

  /**
   * Get ranking metrics for debugging/analytics
   */
  async getRankingMetrics(postId: number, userId: number): Promise<FeedRankingMetrics> {
    const postData = await postsService.getPostWithAuthor(postId);

    const engagementScore = postData.engagementScore;
    const recencyScore = this.calculateRecencyScore(postData.createdAt);
    const personalizationScore = await this.calculatePersonalizationScore(userId, postData.userId);
    const finalScore = engagementScore * 0.4 + recencyScore * 0.3 + personalizationScore * 0.3;

    return {
      postId,
      engagementScore,
      recencyScore,
      personalizedScore: personalizationScore,
      finalScore,
    };
  }
}

export const feedService = new FeedService();

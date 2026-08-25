import { db } from "../../db/index";
import { hashtags, postHashtags, posts, trends } from "../../db/schema";
import { eq, desc, and, ilike } from "drizzle-orm";
import { CreateHashtagInput, HashtagData, TrendData, PostHashtagLink } from "./hashtags.types";

export class HashtagsService {
  /**
   * Extract hashtags from text
   */
  extractHashtags(text: string): string[] {
    const tagRegex = /#(\w+)/g;
    const matches = text.match(tagRegex) || [];
    return [...new Set(matches.map((tag) => tag.substring(1).toLowerCase()))];
  }

  /**
   * Create or get hashtag
   */
  async createOrGetHashtag(tag: string): Promise<HashtagData> {
    const normalizedTag = tag.toLowerCase();

    // Try to find existing
    const existing = await db.select().from(hashtags).where(eq(hashtags.tag, normalizedTag));

    if (existing.length > 0) {
      return existing[0];
    }

    // Create new
    const [newHashtag] = await db
      .insert(hashtags)
      .values({
        tag: normalizedTag,
        usageCount: 0,
      })
      .returning();

    return newHashtag;
  }

  /**
   * Add hashtags to a post
   */
  async addHashtagsToPost(postId: number, tags: string[]): Promise<PostHashtagLink[]> {
    if (!tags.length) return [];

    const uniqueTags = [...new Set(tags.map((t) => t.toLowerCase()))];
    const result: PostHashtagLink[] = [];

    for (const tag of uniqueTags) {
      const hashtag = await this.createOrGetHashtag(tag);

      // Check if already linked
      const existing = await db
        .select()
        .from(postHashtags)
        .where(and(eq(postHashtags.postId, postId), eq(postHashtags.hashtagId, hashtag.id)));

      if (!existing.length) {
        // Create link
        const [link] = await db
          .insert(postHashtags)
          .values({
            postId,
            hashtagId: hashtag.id,
          })
          .returning();

        // Increment usage count
        await db
          .update(hashtags)
          .set({
            usageCount: hashtag.usageCount + 1,
            lastUsedAt: new Date(),
          })
          .where(eq(hashtags.id, hashtag.id));

        result.push(link);
      }
    }

    return result;
  }

  /**
   * Get hashtag by name
   */
  async getHashtag(tag: string): Promise<HashtagData | null> {
    const result = await db.select().from(hashtags).where(eq(hashtags.tag, tag.toLowerCase()));
    return result[0] || null;
  }

  /**
   * Search hashtags
   */
  async searchHashtags(query: string, limit: number = 20): Promise<HashtagData[]> {
    const result = await db
      .select()
      .from(hashtags)
      .where(ilike(hashtags.tag, `%${query}%`))
      .orderBy(desc(hashtags.usageCount))
      .limit(limit);

    return result;
  }

  /**
   * Get trending hashtags
   */
  async getTrendingHashtags(limit: number = 10): Promise<TrendData[]> {
    const result = await db
      .select()
      .from(trends)
      .orderBy(desc(trends.engagementScore))
      .limit(limit);

    return result;
  }

  /**
   * Get posts with a specific hashtag
   */
  async getPostsByHashtag(tag: string, limit: number = 20, offset: number = 0) {
    const hashtag = await this.getHashtag(tag);
    if (!hashtag) {
      return [];
    }

    const result = await db
      .select({
        post: posts,
      })
      .from(postHashtags)
      .leftJoin(posts, eq(postHashtags.postId, posts.id))
      .where(eq(postHashtags.hashtagId, hashtag.id))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    return result.filter((r) => r.post !== null).map((r) => r.post);
  }

  /**
   * Update hashtag usage
   */
  async updateHashtagUsage(hashtagId: number, increment: number): Promise<void> {
    const hashtag = await db.select().from(hashtags).where(eq(hashtags.id, hashtagId));

    if (hashtag.length) {
      await db
        .update(hashtags)
        .set({
          usageCount: Math.max(0, hashtag[0].usageCount + increment),
          lastUsedAt: new Date(),
        })
        .where(eq(hashtags.id, hashtagId));
    }
  }

  /**
   * Get all hashtags for a post
   */
  async getPostHashtags(postId: number): Promise<HashtagData[]> {
    const result = await db
      .select({
        hashtag: hashtags,
      })
      .from(postHashtags)
      .leftJoin(hashtags, eq(postHashtags.hashtagId, hashtags.id))
      .where(eq(postHashtags.postId, postId));

    return result.filter((r) => r.hashtag !== null).map((r) => r.hashtag!);
  }

  /**
   * Get trending hashtags from top posts (helper for trends calculation)
   */
  async calculateTrends(): Promise<void> {
    // Get hashtags used in high-engagement posts
    const topPosts = await db
      .select()
      .from(posts)
      .orderBy(desc(posts.engagementScore))
      .limit(100);

    const trendMap = new Map<string, { tag: string; postCount: number; engagementScore: number }>();

    for (const post of topPosts) {
      const postTags = await this.getPostHashtags(post.id);
      for (const tag of postTags) {
        const existing = trendMap.get(tag.tag) || {
          tag: tag.tag,
          postCount: 0,
          engagementScore: 0,
        };
        existing.postCount += 1;
        existing.engagementScore += post.engagementScore;
        trendMap.set(tag.tag, existing);
      }
    }

    // Update or create trends
    for (const [tagName, data] of trendMap) {
      const existing = await db.select().from(trends).where(eq(trends.tag, tagName));

      if (existing.length) {
        await db
          .update(trends)
          .set({
            postCount: data.postCount,
            engagementScore: data.engagementScore,
            lastUpdatedAt: new Date(),
          })
          .where(eq(trends.tag, tagName));
      } else {
        await db
          .insert(trends)
          .values({
            tag: tagName,
            postCount: data.postCount,
            engagementScore: data.engagementScore,
          })
          .returning();
      }
    }
  }
}

export const hashtagsService = new HashtagsService();

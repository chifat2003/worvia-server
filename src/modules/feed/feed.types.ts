export interface FeedPost {
  id: number;
  userId: number;
  content: string;
  contentHtml: string | null | undefined;
  image: string | null | undefined;
  visibility: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  engagementScore: number;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
    profilePhoto?: string;
  };
  isLikedByUser?: boolean;
  hashtags?: string[];
}

export interface FeedOptions {
  userId: number;
  limit?: number;
  offset?: number;
  algorithm?: "engagement" | "recency" | "hybrid";
  timeWindow?: number; // hours (default 7 days)
}

export interface FeedRankingMetrics {
  postId: number;
  engagementScore: number;
  recencyScore: number;
  personalizedScore: number;
  finalScore: number;
}

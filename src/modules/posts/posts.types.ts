export interface CreatePostInput {
  userId: number;
  content: string;
  contentHtml?: string;
  image?: string;
  visibility?: "public" | "connections" | "private";
}

export interface UpdatePostInput {
  content?: string;
  contentHtml?: string;
  image?: string;
  visibility?: "public" | "connections" | "private";
}

export interface PostWithAuthor {
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
}

export interface PostEngagementMetrics {
  postId: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  engagementScore: number;
}

export interface PostFeedFilter {
  userId?: number;
  visibility?: string;
  limit?: number;
  offset?: number;
  sortBy?: "recent" | "engagement";
}

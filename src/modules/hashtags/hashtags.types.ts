export interface CreateHashtagInput {
  tag: string;
}

export interface HashtagData {
  id: number;
  tag: string;
  usageCount: number;
  lastUsedAt: Date;
  createdAt: Date;
}

export interface TrendData {
  id: number;
  tag: string;
  postCount: number;
  engagementScore: number;
  lastUpdatedAt: Date;
  createdAt: Date;
}

export interface PostHashtagLink {
  id: number;
  postId: number;
  hashtagId: number;
  createdAt: Date;
}

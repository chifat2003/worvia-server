export interface CreateCommentInput {
  postId: number;
  userId: number;
  content: string;
  contentHtml?: string;
  parentCommentId?: number;
}

export interface UpdateCommentInput {
  content?: string;
  contentHtml?: string;
}

export interface CommentWithAuthor {
  id: number;
  postId: number;
  userId: number;
  parentCommentId: number | null;
  content: string;
  contentHtml: string | null | undefined;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
    profilePhoto?: string;
  };
  replies?: CommentWithAuthor[];
}

export interface CommentThread {
  id: number;
  postId: number;
  comments: CommentWithAuthor[];
}

export interface CommentFilter {
  postId: number;
  parentCommentId?: number | null;
  limit?: number;
  offset?: number;
}

export interface CreateLikeInput {
  userId: number;
  postId?: number;
  commentId?: number;
}

export interface LikeTarget {
  userId: number;
  postId: number | null;
  commentId: number | null;
  createdAt: Date;
}

export interface LikeStats {
  postId?: number;
  commentId?: number;
  likeCount: number;
  userLiked?: boolean;
}

export interface UserLike {
  id: number;
  userId: number;
  postId: number | null;
  commentId: number | null;
  createdAt: Date;
}

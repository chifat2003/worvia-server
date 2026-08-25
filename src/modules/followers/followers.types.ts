export interface FollowResponse {
  id: number;
  followerId: number;
  followingId: number;
  followedAt: Date;
  profile?: {
    firstName: string;
    lastName: string;
    headline?: string;
  };
}

export interface FollowerStats {
  followers: number;
  following: number;
}

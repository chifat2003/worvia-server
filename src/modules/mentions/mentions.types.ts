export interface CreateMentionRequest {
  mentionedUserIds: number[];
  context: "post" | "comment" | "message";
  contextId: number;
  message?: string;
}

export interface MentionResponse {
  id: number;
  mentionedUserId: number;
  mentionedByUserId: number;
  context: string;
  contextId: number;
  isRead: boolean;
  createdAt: Date;
  mentionedByProfile?: {
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
}

export interface MentionStats {
  total: number;
  unread: number;
  byContext: Record<string, number>;
}

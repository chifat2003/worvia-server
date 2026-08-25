export interface CreateNotificationRequest {
  userId: number;
  type: string;
  title: string;
  message?: string;
  relatedUserId?: number;
  data?: Record<string, any>;
}

export interface NotificationResponse {
  id: number;
  userId: number;
  type: string;
  title: string;
  message?: string;
  isRead: boolean;
  createdAt: Date;
  relatedUser?: {
    id: number;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  types: Record<string, number>;
}

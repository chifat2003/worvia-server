export interface SendConnectionRequest {
  receiverId: number;
}

export interface RespondConnectionRequest {
  connectionId: number;
  action: "accept" | "reject";
}

export interface ConnectionResponse {
  id: number;
  senderId: number;
  receiverId: number;
  status: string;
  sentAt: Date;
  respondedAt?: Date;
  senderProfile?: {
    firstName: string;
    lastName: string;
    headline?: string;
  };
  receiverProfile?: {
    firstName: string;
    lastName: string;
    headline?: string;
  };
}

export interface ConnectionStats {
  totalConnections: number;
  pendingRequests: number;
  sentRequests: number;
}

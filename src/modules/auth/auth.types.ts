// Auth request/response types
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: "professional" | "recruiter" | "company" | "admin";
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken?: string;
    user: {
      id: number;
      email: string;
      role: string;
      profile?: {
        firstName: string;
        lastName: string;
      };
    };
  };
  error?: string;
  code?: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  headline?: string;
  summary?: string;
  location?: string;
  skills?: string[];
  visibility?: "public" | "connections" | "private";
}

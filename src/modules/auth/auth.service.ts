import { db } from "../../db";
import { users, profiles } from "../../db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "./password";
import { jwtUtils } from "./jwt";
import { RegisterRequest, LoginRequest, AuthResponse } from "./auth.types";

class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const authService = {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return {
          success: false,
          error: "Invalid email format",
          code: "INVALID_EMAIL",
        };
      }

      // Check if email already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, data.email.toLowerCase()),
      });

      if (existingUser) {
        return {
          success: false,
          error: "Email already registered",
          code: "EMAIL_EXISTS",
        };
      }

      // Validate password strength
      if (data.password.length < 8) {
        return {
          success: false,
          error: "Password must be at least 8 characters",
          code: "WEAK_PASSWORD",
        };
      }

      // Hash password
      const passwordHash = hashPassword(data.password);

      // Create user
      const newUser = await db
        .insert(users)
        .values({
          email: data.email.toLowerCase(),
          passwordHash,
          role: data.role || "professional",
          isActive: true,
        })
        .returning();

      const user = newUser[0];

      // Create profile
      await db.insert(profiles).values({
        userId: user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        visibility: "public",
      });

      // Generate tokens
      const accessToken = jwtUtils.generateAccessToken(
        user.id,
        user.email,
        user.role
      );

      return {
        success: true,
        data: {
          accessToken,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            profile: {
              firstName: data.firstName,
              lastName: data.lastName,
            },
          },
        },
      };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: "Registration failed",
        code: "REGISTRATION_FAILED",
      };
    }
  },

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await db.query.users.findFirst({
        where: eq(users.email, data.email.toLowerCase()),
      });

      if (!user) {
        return {
          success: false,
          error: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          error: "Account is deactivated",
          code: "ACCOUNT_DEACTIVATED",
        };
      }

      // Verify password
      const passwordValid = verifyPassword(data.password, user.passwordHash);
      if (!passwordValid) {
        return {
          success: false,
          error: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
        };
      }

      // Get profile
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, user.id),
      });

      // Generate tokens
      const accessToken = jwtUtils.generateAccessToken(
        user.id,
        user.email,
        user.role
      );
      const refreshToken = jwtUtils.generateRefreshToken(user.id);

      return {
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            profile: profile
              ? {
                  firstName: profile.firstName,
                  lastName: profile.lastName,
                }
              : undefined,
          },
        },
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: "Login failed",
        code: "LOGIN_FAILED",
      };
    }
  },

  /**
   * Get current user info
   */
  async getCurrentUser(userId: number): Promise<AuthResponse> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        return {
          success: false,
          error: "User not found",
          code: "USER_NOT_FOUND",
        };
      }

      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, user.id),
      });

      return {
        success: true,
        data: {
          accessToken: "", // Not needed for this endpoint
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            profile: profile
              ? {
                  firstName: profile.firstName,
                  lastName: profile.lastName,
                }
              : undefined,
          },
        },
      };
    } catch (error) {
      console.error("Get current user error:", error);
      return {
        success: false,
        error: "Failed to fetch user",
        code: "FETCH_USER_FAILED",
      };
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const payload = jwtUtils.verifyToken(refreshToken);
      if (!payload) {
        return {
          success: false,
          error: "Invalid or expired refresh token",
          code: "INVALID_REFRESH_TOKEN",
        };
      }

      const user = await db.query.users.findFirst({
        where: eq(users.id, payload.userId),
      });

      if (!user) {
        return {
          success: false,
          error: "User not found",
          code: "USER_NOT_FOUND",
        };
      }

      const newAccessToken = jwtUtils.generateAccessToken(
        user.id,
        user.email,
        user.role
      );

      return {
        success: true,
        data: {
          accessToken: newAccessToken,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
        },
      };
    } catch (error) {
      console.error("Refresh token error:", error);
      return {
        success: false,
        error: "Token refresh failed",
        code: "REFRESH_FAILED",
      };
    }
  },
};

import { Request, Response } from "express";
import { authService } from "./auth.service";
import { jwtUtils } from "./jwt";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
        role: string;
      };
    }
  }
}

export const authController = {
  /**
   * Register endpoint
   */
  async register(req: Request, res: Response) {
    const { email, password, firstName, lastName, role } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        code: "VALIDATION_ERROR",
      });
    }

    const result = await authService.register({
      email,
      password,
      firstName,
      lastName,
      role,
    });

    const statusCode = result.success ? 201 : 400;
    res.status(statusCode).json(result);
  },

  /**
   * Login endpoint
   */
  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password required",
        code: "VALIDATION_ERROR",
      });
    }

    const result = await authService.login({ email, password });
    const statusCode = result.success ? 200 : 401;
    res.status(statusCode).json(result);
  },

  /**
   * Get current user endpoint
   */
  async getCurrentUser(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      });
    }

    const result = await authService.getCurrentUser(req.user.userId);
    res.status(result.success ? 200 : 404).json(result);
  },

  /**
   * Refresh token endpoint
   */
  async refreshToken(req: Request, res: Response) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: "Refresh token required",
        code: "VALIDATION_ERROR",
      });
    }

    const result = await authService.refreshToken(refreshToken);
    res.status(result.success ? 200 : 401).json(result);
  },

  /**
   * Logout endpoint
   */
  async logout(req: Request, res: Response) {
    // Token invalidation would typically happen on client side (remove from storage)
    // Or store blacklist on server
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  },
};

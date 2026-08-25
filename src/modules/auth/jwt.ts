import jwt, { SignOptions } from "jsonwebtoken";
import { JWTPayload } from "./auth.types";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";
const JWT_EXPIRE = process.env.JWT_EXPIRE || "24h";

// Helper to convert expire string to milliseconds
const getExpiresIn = (expireStr: string): string | number => {
  // Return as-is, jwt library will handle the conversion
  return expireStr;
};

export const jwtUtils = {
  /**
   * Generate access token
   */
  generateAccessToken(userId: number, email: string, role: string): string {
    return jwt.sign({ userId, email, role }, JWT_SECRET, {
      expiresIn: getExpiresIn(JWT_EXPIRE),
    } as SignOptions);
  },

  /**
   * Generate refresh token (longer expiry)
   */
  generateRefreshToken(userId: number): string {
    return jwt.sign({ userId }, JWT_SECRET, {
      expiresIn: "7d", // Longer expiry for refresh tokens
    } as SignOptions);
  },

  /**
   * Verify token and get payload
   */
  verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  },

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  },

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(header?: string): string | null {
    if (!header) return null;
    
    const parts = header.split(" ");
    if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
      return null;
    }
    
    return parts[1];
  },
};

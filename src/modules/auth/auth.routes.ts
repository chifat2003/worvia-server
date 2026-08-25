import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";
import { hashPassword, verifyPassword } from "./password";

export const authRouter = Router();

authRouter.post("/register", async (req, res, next) => {
  try {
    const body = req.body as Partial<{
      name: string;
      email: string;
      password: string;
    }>;

    if (!body.name || !body.email || !body.password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    const [user] = await db
      .insert(users)
      .values({
        name: body.name,
        email: body.email.toLowerCase(),
        password: hashPassword(body.password),
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      });

    return res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const body = req.body as Partial<{
      email: string;
      password: string;
    }>;

    if (!body.email || !body.password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email.toLowerCase()))
      .limit(1);

    if (!user || !verifyPassword(body.password, user.password)) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    return res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

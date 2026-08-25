import { Router } from "express";
import { desc } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";

export const usersRouter = Router();

usersRouter.get("/", async (_req, res, next) => {
  try {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    res.json({ users: result });
  } catch (error) {
    next(error);
  }
});

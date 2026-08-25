import express from "express";
import { sql } from "./db";
import { errorMiddleware } from "./middleware/error.middleware";
import { routes } from "./routes";

export const app = express();

app.use(express.json());

app.get("/", async (_req, res, next) => {
  try {
    const result = await sql`SELECT NOW()`;

    res.json({
      message: "Worvia server is running",
      database: "Connected",
      time: result[0].now,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Database connection failed",
    });
  }
});

app.use("/api", routes);

app.use(errorMiddleware);

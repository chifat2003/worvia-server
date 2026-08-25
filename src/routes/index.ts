import { Router } from "express";
import authRouter from "../modules/auth/auth.routes";
import { usersRouter } from "../modules/users/users.routes";

export const routes = Router();

routes.use("/v1/auth", authRouter);
routes.use("/v1/users", usersRouter);

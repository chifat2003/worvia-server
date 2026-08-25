import { Router } from "express";
import authRouter from "../modules/auth/auth.routes";
import { usersRouter } from "../modules/users/users.routes";
import { connectionsRouter } from "../modules/connections/connections.routes";
import { followersRouter } from "../modules/followers/followers.routes";
import { suggestionsRouter } from "../modules/suggestions/suggestions.routes";
import { notificationsRouter } from "../modules/notifications/notifications.routes";
import { mentionsRouter } from "../modules/mentions/mentions.routes";

export const routes = Router();

routes.use("/v1/auth", authRouter);
routes.use("/v1/users", usersRouter);
routes.use("/v1/connections", connectionsRouter);
routes.use("/v1/followers", followersRouter);
routes.use("/v1/suggestions", suggestionsRouter);
routes.use("/v1/notifications", notificationsRouter);
routes.use("/v1/mentions", mentionsRouter);

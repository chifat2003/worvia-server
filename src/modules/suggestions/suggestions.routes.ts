import { Router } from "express";
import { suggestionsController } from "./suggestions.controller";
import { authenticateToken } from "../../middleware/auth.middleware";

export const suggestionsRouter = Router();

/**
 * GET /api/v1/suggestions
 * Get connection suggestions using hybrid algorithm
 */
suggestionsRouter.get(
  "/",
  authenticateToken,
  suggestionsController.getConnectionSuggestions
);

/**
 * GET /api/v1/suggestions/personalized
 * Get personalized suggestions
 */
suggestionsRouter.get(
  "/personalized",
  authenticateToken,
  suggestionsController.getPersonalizedSuggestions
);

/**
 * GET /api/v1/suggestions/skill/:skill
 * Get suggestions for users with specific skill
 */
suggestionsRouter.get(
  "/skill/:skill",
  authenticateToken,
  suggestionsController.getSuggestionsBySkill
);

/**
 * GET /api/v1/suggestions/location
 * Get suggestions for users in same location
 */
suggestionsRouter.get(
  "/location",
  authenticateToken,
  suggestionsController.getSuggestionsByLocation
);

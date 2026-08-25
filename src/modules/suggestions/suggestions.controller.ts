import { Request, Response } from "express";
import { suggestionsService } from "./suggestions.service";

export const suggestionsController = {
  /**
   * Get connection suggestions
   * GET /api/v1/suggestions?limit=10
   */
  async getConnectionSuggestions(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const limit = Math.min(
      parseInt(req.query.limit as string) || 10,
      50
    );

    const result = await suggestionsService.getConnectionSuggestions(
      req.user.userId,
      limit
    );
    res.status(result.success ? 200 : 400).json(result);
  },

  /**
   * Get personalized suggestions
   * GET /api/v1/suggestions/personalized?limit=10
   */
  async getPersonalizedSuggestions(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const limit = Math.min(
      parseInt(req.query.limit as string) || 10,
      50
    );

    const result = await suggestionsService.getPersonalizedSuggestions(
      req.user.userId,
      limit
    );
    res.status(result.success ? 200 : 400).json(result);
  },

  /**
   * Get suggestions by skill
   * GET /api/v1/suggestions/skill/:skill?limit=10
   */
  async getSuggestionsBySkill(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const skill = req.params.skill as string;
    const limit = Math.min(
      parseInt(req.query.limit as string) || 10,
      50
    );

    if (!skill || skill.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Skill parameter required",
      });
    }

    const result = await suggestionsService.getSuggestionsBySkill(
      req.user.userId,
      skill,
      limit
    );
    res.status(result.success ? 200 : 400).json(result);
  },

  /**
   * Get suggestions by location
   * GET /api/v1/suggestions/location?limit=10
   */
  async getSuggestionsByLocation(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const limit = Math.min(
      parseInt(req.query.limit as string) || 10,
      50
    );

    const result = await suggestionsService.getSuggestionsByLocation(
      req.user.userId,
      limit
    );
    res.status(result.success ? 200 : 400).json(result);
  },
};

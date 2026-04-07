import { Request, Response } from "express";
import {
  searchDentists,
  getSearchHistory,
  deleteSearchHistory,
  autocompleteCities as autocompleteCitiesService,
} from "../services/googlePlacesService";

export const search = async (req: Request, res: Response) => {
  try {
    const { location, minRating = 3.5, minReviews = 10, targetLeads = 20 } = req.body;
    const userEmail = req.userEmail!;

    if (!location || !location.trim()) {
      res.status(400).json({ message: "Location is required" });
      return;
    }

    const target = Math.max(Number(targetLeads), 1);

    const result = await searchDentists(
      location.trim(),
      Number(minRating),
      Number(minReviews),
      target,
      userEmail
    );

    res.json(result);
  } catch (error) {
    console.error("Search error:", error);
    res
      .status(500)
      .json({ message: error instanceof Error ? error.message : "Search failed" });
  }
};

export const autocompleteCities = async (req: Request, res: Response) => {
  try {
    const input = req.query.q as string;
    if (!input || input.length < 1) {
      res.json({ suggestions: [] });
      return;
    }
    const suggestions = await autocompleteCitiesService(input);
    res.json({ suggestions });
  } catch (error) {
    console.error("Autocomplete error:", error);
    res.json({ suggestions: [] });
  }
};

export const deleteHistory = async (req: Request, res: Response) => {
  try {
    const userEmail = req.userEmail!;
    const deleted = await deleteSearchHistory(req.params.id as string, userEmail);
    if (!deleted) {
      res.status(404).json({ message: "Search history not found" });
      return;
    }
    res.json({ message: "Search history deleted" });
  } catch (error) {
    console.error("Delete history error:", error);
    res.status(500).json({ message: "Failed to delete search history" });
  }
};

export const history = async (req: Request, res: Response) => {
  try {
    const userEmail = req.userEmail!;
    const searches = await getSearchHistory(userEmail);
    res.json({ searches });
  } catch (error) {
    console.error("Search history error:", error);
    res.status(500).json({ message: "Failed to fetch search history" });
  }
};

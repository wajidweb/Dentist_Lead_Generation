import { Request, Response } from "express";
import {
  searchDentists,
  getSearchHistory,
} from "../services/googlePlacesService";

export const search = async (req: Request, res: Response) => {
  try {
    const { location, minRating = 3.5, minReviews = 10 } = req.body;

    if (!location) {
      res.status(400).json({ message: "Location is required" });
      return;
    }

    const result = await searchDentists(
      location,
      Number(minRating),
      Number(minReviews)
    );

    res.json(result);
  } catch (error) {
    console.error("Search error:", error);
    res
      .status(500)
      .json({ message: error instanceof Error ? error.message : "Search failed" });
  }
};

export const history = async (_req: Request, res: Response) => {
  try {
    const searches = await getSearchHistory();
    res.json({ searches });
  } catch (error) {
    console.error("Search history error:", error);
    res.status(500).json({ message: "Failed to fetch search history" });
  }
};

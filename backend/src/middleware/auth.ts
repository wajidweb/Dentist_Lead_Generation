import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      userEmail?: string;
      userRole?: string;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      email: string;
      role: string;
    };
    req.userEmail = decoded.email;
    req.userRole = decoded.role;
    next();
  } catch {
    res.status(401).json({ message: "Token expired or invalid" });
  }
};

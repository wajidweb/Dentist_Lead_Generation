import { Request, Response } from "express";
import { loginAdmin, verifyToken } from "../services/authService";

export const login = (req: Request, res: Response) => {
  const { email, password } = req.body;

  const result = loginAdmin(email, password);

  if (!result) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  res.json(result);
};

export const verify = (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];
  const user = verifyToken(token);

  if (!user) {
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }

  res.json({ user });
};

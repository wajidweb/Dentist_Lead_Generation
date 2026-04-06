import jwt from "jsonwebtoken";

interface LoginResult {
  token: string;
  user: { email: string; role: string };
}

export const loginAdmin = (email: string, password: string): LoginResult | null => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (email !== adminEmail || password !== adminPassword) {
    return null;
  }

  const token = jwt.sign(
    { email, role: "admin" },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );

  return { token, user: { email, role: "admin" } };
};

export const verifyToken = (token: string): { email: string; role: string } | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      email: string;
      role: string;
    };
    return { email: decoded.email, role: decoded.role };
  } catch {
    return null;
  }
};

import { type Request, type Response, type NextFunction } from "express";

export function apiAuth(req: Request, res: Response, next: NextFunction) {
  const token = process.env.API_TOKEN;
  if (!token) {
    console.warn("[auth] API_TOKEN not set; /api is unprotected");
    return next();
  }

  const header = req.header("authorization") ?? "";
  const [scheme, value] = header.split(" ");
  if (scheme !== "Bearer" || value !== token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

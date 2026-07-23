import path from "path";
import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Allow the frontend origin; fall back to same-origin only in production
const allowedOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, mobile apps)
    if (!origin) return callback(null, true);
    // In development allow any *.replit.dev / localhost origin
    if (
      process.env.NODE_ENV !== "production" &&
      (origin.includes(".replit.dev") || origin.startsWith("http://localhost"))
    ) {
      return callback(null, true);
    }
    // In production, require explicit allowlist
    if (allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Not allowed: skip CORS headers instead of throwing a 500.
    // The browser will block cross-origin JS from reading the response,
    // but same-origin asset requests (which also send an Origin header
    // due to Vite's crossorigin script/link tags) won't crash the server.
    callback(null, false);
  },
  credentials: true,
});
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", corsMiddleware, router);
// ── Production: serve the compiled Vite frontend ──────────────────────────
// In the Railway Docker image, `public/` sits next to `dist/` under /app.
// Express serves the static assets first; the SPA fallback sends index.html
// for any path that doesn't match a real file or an /api route.
if (process.env.NODE_ENV === "production") {
  const staticDir = path.resolve("public");
  app.use(express.static(staticDir, { index: "index.html" }));
  app.use((_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

export default app;

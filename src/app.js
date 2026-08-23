import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import leadsRoutes from "./routes/leads.routes.js";
import resourcesRoutes from "./routes/resources.routes.js";
import documentsRoutes from "./routes/documents.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import emailsRoutes from "./routes/emails.routes.js";
import backupRoutes from "./routes/backup.routes.js";


const app = express();

const clientUrls = (process.env.CLIENT_URL || "").split(",")
  .map((url) => url.trim())
  .filter(Boolean);
const allowedOrigins = new Set([
  ...clientUrls,
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  "http://127.0.0.1:5000",
  "http://localhost:5000",
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "http://127.0.0.1:5174",
  "http://localhost:5174",
]);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin)) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

// Set up security headers, but allow inline scripts/styles for Vite development
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/uploads", express.static(path.resolve(process.env.UPLOAD_PATH || "uploads")));

app.get("/api/health", (req, res) => res.json({ success: true, status: "healthy" }));
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/leads", leadsRoutes);
app.use("/api", resourcesRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/emails", emailsRoutes);
app.use("/api/backup", backupRoutes);


// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === "P2002") return res.status(409).json({ success: false, message: "Cette valeur existe déjà." });
  if (err.code === "P2025") return res.status(404).json({ success: false, message: "Ressource introuvable." });
  if (err.name === "MulterError") return res.status(400).json({ success: false, message: err.message });
  return res.status(500).json({ success: false, message: "Erreur interne du serveur." });
});

export default app;

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const leadsRoutes = require("./routes/leads.routes");
const resourcesRoutes = require("./routes/resources.routes");
const documentsRoutes = require("./routes/documents.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const aiRoutes = require("./routes/ai.routes");

const app = express();

const clientUrls = (process.env.CLIENT_URL || "").split(",")
  .map((url) => url.trim())
  .filter(Boolean);
const allowedOrigins = new Set([
  ...clientUrls,
  "http://127.0.0.1:3000",
  "http://localhost:3000",
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

app.use(helmet());

app.use(compression());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

app.use(cookieParser());

app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));
app.use("/uploads", express.static(path.resolve(process.env.UPLOAD_PATH || "uploads")));

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Tracking Lead System API"
    });
});

app.get("/api/health", (req, res) => res.json({ success: true, status: "healthy" }));
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/leads", leadsRoutes);
app.use("/api", resourcesRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);
app.use((req, res) => res.status(404).json({ success: false, message: "Route introuvable." }));
app.use((err, req, res, next) => {
    console.error(err);
    if (err.code === "P2002") return res.status(409).json({ success: false, message: "Cette valeur existe déjà." });
    if (err.code === "P2025") return res.status(404).json({ success: false, message: "Ressource introuvable." });
    if (err.name === "MulterError") return res.status(400).json({ success: false, message: err.message });
    return res.status(500).json({ success: false, message: "Erreur interne du serveur." });
});

module.exports = app;

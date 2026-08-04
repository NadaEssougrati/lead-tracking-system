import dotenv from "dotenv";
import http from "http";
import path from "path";
import express from "express";
import app from "./src/app.js";
import prisma from "./src/lib/prisma.js";

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;
const server = http.createServer(app);

// Configure Vite Dev Middleware or Static File Server
async function configureVite() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in development mode. Initializing Vite middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in production mode. Serving static assets from dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

async function start() {
  await configureVite();
  
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
});

async function shutdown() {
  console.log("Shutting down database client...");
  await prisma.$disconnect();
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

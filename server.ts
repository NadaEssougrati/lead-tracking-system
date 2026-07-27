import express from "express";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createServer as createViteServer } from "vite";
import { db, pool } from "./src/db/index.ts";
import { users, activityLogs } from "./src/db/schema.ts";
import { eq, desc, count, and } from "drizzle-orm";
import * as dotenv from "dotenv";
import { leadRouter } from "./src/routes/leadRoutes.ts";
import { entrepriseRouter } from "./src/routes/entrepriseRoutes.ts";
import { tacheRouter } from "./src/routes/tacheRoutes.ts";
import { devisRouter } from "./src/routes/devisRoutes.ts";
import { notificationRouter } from "./src/routes/notificationRoutes.ts";
import { kpiRouter } from "./src/routes/kpiRoutes.ts";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "brutalist-secure-jwt-key-2026";

app.use(express.json());

// Role translation helpers between Database (French) and Frontend (English)
function mapRoleToFrontend(role: string): string {
  if (role === "Administrateur") return "admin";
  if (role === "Manager") return "manager";
  if (role === "Commercial") return "commercial";
  if (role === "AgentMarketing") return "marketing";
  return "user";
}

function mapRoleToBackend(role: string): string {
  if (role === "admin") return "Administrateur";
  if (role === "manager") return "Manager";
  if (role === "commercial") return "Commercial";
  if (role === "marketing") return "AgentMarketing";
  return "Commercial";
}

// Seeding Helper - updated for CRM
async function seedDatabase() {
  try {
    const res = await pool.query("SELECT COUNT(*) FROM utilisateur");
    const countVal = parseInt(res.rows[0].count);
    if (countVal === 0) {
      console.log("No CRM users found in 'utilisateur' table. Please run 'node seed.js' to seed the database.");
    } else {
      console.log(`Database has ${countVal} CRM users in 'utilisateur'.`);
    }
  } catch (error) {
    console.error("Failed to check CRM database: make sure you run 'node seed.js' to create tables and seed data.", error);
  }
}

// Custom Auth Middleware
interface CustomRequest extends express.Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
    status: string;
  };
}

const authenticateToken = async (req: CustomRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. Token missing." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string };
    
    // Fetch latest user info from CRM utilisateur table
    const userListRes = await pool.query(
      "SELECT id, nom, prenom, email, role, actif FROM utilisateur WHERE id = $1 LIMIT 1",
      [decoded.id]
    );
    const user = userListRes.rows[0];

    if (!user) {
      return res.status(401).json({ error: "User no longer exists." });
    }

    if (!user.actif) {
      return res.status(403).json({ error: "Account is disabled. Please contact an administrator." });
    }

    req.user = {
      id: user.id,
      username: `${user.prenom} ${user.nom}`,
      email: user.email,
      role: user.role,
      status: user.actif ? "active" : "disabled",
    };
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token." });
  }
};

const requireAdmin = (req: CustomRequest, res: express.Response, next: express.NextFunction) => {
  if (!req.user || req.user.role !== "Administrateur") {
    return res.status(403).json({ error: "Unauthorized. Admin privileges required." });
  }
  next();
};

// --- AUTH API ROUTES ---

// Login
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip || "127.0.0.1";

  if (!username || !password) {
    return res.status(400).json({ error: "Nom d'utilisateur et mot de passe requis." });
  }

  // Trim and lowercase username input to handle trailing spaces or casing differences
  const cleanUsername = String(username || "").trim().toLowerCase();

  try {
    // Find user by email or username prefix in utilisateur table (case-insensitive)
    const userListRes = await pool.query(
      "SELECT * FROM utilisateur WHERE LOWER(email) = $1 OR LOWER(email) LIKE $1 || '@%' LIMIT 1",
      [cleanUsername]
    );
    let user = userListRes.rows[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    if (!user.actif) {
      return res.status(403).json({ error: "Account is disabled. Please contact an administrator." });
    }

    // Verify Password
    const isPasswordValid = await bcrypt.compare(password, user.mot_de_passe);
    if (!isPasswordValid) {
      // Log failed login attempt
      await db.insert(activityLogs).values({
        userId: user.id,
        username: `${user.prenom} ${user.nom}`,
        action: "FAILED_LOGIN",
        details: "Failed login attempt: Invalid password.",
        ipAddress: ip,
      });
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user.id, username: `${user.prenom} ${user.nom}` },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Log login action
    await db.insert(activityLogs).values({
      userId: user.id,
      username: `${user.prenom} ${user.nom}`,
      action: "LOGIN",
      details: `User logged in successfully from IP ${ip}`,
      ipAddress: ip,
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: `${user.prenom} ${user.nom}`,
        email: user.email,
        role: mapRoleToFrontend(user.role),
        status: user.actif ? "active" : "disabled",
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Register
app.post("/api/auth/register", async (req, res) => {
  const { username, email, password, role } = req.body;
  const ip = req.ip || "127.0.0.1";

  // Basic Validation
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Username, email, and password are required." });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: "Username must be at least 3 characters long." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }

  // Map English roles to French if needed
  let requestedRole = role || "Commercial";
  if (requestedRole === "admin") requestedRole = "Administrateur";
  if (requestedRole === "manager") requestedRole = "Manager";
  if (requestedRole === "commercial") requestedRole = "Commercial";
  if (requestedRole === "marketing") requestedRole = "AgentMarketing";

  const validRoles = ["Administrateur", "Manager", "Commercial", "AgentMarketing"];
  if (!validRoles.includes(requestedRole)) {
    return res.status(400).json({ error: "Invalid role specified." });
  }

  try {
    // Check if email already exists
    const existingEmailRes = await pool.query(
      "SELECT 1 FROM utilisateur WHERE email = $1 LIMIT 1",
      [email]
    );
    if (existingEmailRes.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered." });
    }

    // Split username to nom and prenom
    const parts = username.trim().split(/\s+/);
    const prenom = parts[0] || "Utilisateur";
    const nom = parts.slice(1).join(" ") || "CRM";

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user into utilisateur
    const insertRes = await pool.query(
      `INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, role, actif)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING *`,
      [nom, prenom, email, hashedPassword, requestedRole]
    );
    const newUser = insertRes.rows[0];
    const newUsername = `${newUser.prenom} ${newUser.nom}`;

    // Log registration
    await db.insert(activityLogs).values({
      userId: newUser.id,
      username: newUsername,
      action: "REGISTER",
      details: `User registered self-service with role: ${newUser.role}`,
      ipAddress: ip,
    });

    // Auto-login upon registration
    const token = jwt.sign(
      { id: newUser.id, username: newUsername },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUsername,
        email: newUser.email,
        role: mapRoleToFrontend(newUser.role),
        status: newUser.actif ? "active" : "disabled",
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Logout (mostly client-side, but logs for security)
app.post("/api/auth/logout", authenticateToken, async (req: CustomRequest, res) => {
  const ip = req.ip || "127.0.0.1";
  if (req.user) {
    try {
      await db.insert(activityLogs).values({
        userId: req.user.id,
        username: req.user.username,
        action: "LOGOUT",
        details: `User logged out successfully`,
        ipAddress: ip,
      });
    } catch (e) {
      console.error("Failed to log logout", e);
    }
  }
  res.json({ message: "Logged out successfully." });
});

// Me (Check current session details)
app.get("/api/auth/me", authenticateToken, (req: CustomRequest, res) => {
  if (req.user) {
    res.json({
      user: {
        ...req.user,
        role: mapRoleToFrontend(req.user.role),
      },
    });
  } else {
    res.status(401).json({ error: "Access denied." });
  }
});


// --- ADMIN USER MANAGEMENT API ROUTES ---

// Get all users
app.get("/api/admin/users", authenticateToken, requireAdmin, async (req: CustomRequest, res) => {
  try {
    const userQuery = await pool.query(
      "SELECT id, nom, prenom, email, role, actif FROM utilisateur ORDER BY id DESC"
    );
    
    const mappedUsers = userQuery.rows.map(u => ({
      id: u.id,
      username: `${u.prenom} ${u.nom}`,
      email: u.email,
      role: mapRoleToFrontend(u.role),
      status: u.actif ? "active" : "disabled",
      createdAt: new Date(), // Table lacks creation date, fallback to now
      updatedAt: new Date(),
    }));
    
    res.json(mappedUsers);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Failed to fetch users." });
  }
});

// Create user directly from Admin Console
app.post("/api/admin/users", authenticateToken, requireAdmin, async (req: CustomRequest, res) => {
  const { username, email, password, role, status } = req.body;
  const ip = req.ip || "127.0.0.1";

  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: "Username, email, password, and role are required." });
  }

  try {
    const cleanEmail = String(email || "").trim().toLowerCase();
    
    // Check if email already registered
    const existingEmail = await pool.query(
      "SELECT 1 FROM utilisateur WHERE LOWER(email) = $1 LIMIT 1",
      [cleanEmail]
    );
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered." });
    }

    // Split username to prenom and nom
    const parts = username.trim().split(/\s+/);
    const prenom = parts[0] || "Utilisateur";
    const nom = parts.slice(1).join(" ") || "CRM";

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const mappedRole = mapRoleToBackend(role);
    const active = status !== "disabled";

    const insertRes = await pool.query(
      `INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, role, actif)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [nom, prenom, cleanEmail, hashedPassword, mappedRole, active]
    );
    
    const createdUser = insertRes.rows[0];

    // Log admin action
    await db.insert(activityLogs).values({
      userId: req.user!.id,
      username: req.user!.username,
      action: "REGISTER",
      details: `Admin created user '${createdUser.prenom} ${createdUser.nom}' with role '${createdUser.role}' and status '${createdUser.actif ? "active" : "disabled"}'`,
      ipAddress: ip,
    });

    res.status(201).json({
      id: createdUser.id,
      username: `${createdUser.prenom} ${createdUser.nom}`,
      email: createdUser.email,
      role: mapRoleToFrontend(createdUser.role),
      status: createdUser.actif ? "active" : "disabled",
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Admin user creation error:", error);
    res.status(500).json({ error: "Failed to create user." });
  }
});

// Edit user (role, status, email, username)
app.put("/api/admin/users/:id", authenticateToken, requireAdmin, async (req: CustomRequest, res) => {
  const targetUserId = parseInt(req.params.id);
  const { username, email, role, status, password } = req.body;
  const ip = req.ip || "127.0.0.1";

  if (isNaN(targetUserId)) {
    return res.status(400).json({ error: "Invalid user ID." });
  }

  // Prevent admin from disabling or demoting themselves
  if (targetUserId === req.user!.id) {
    if (status === "disabled") {
      return res.status(400).json({ error: "You cannot disable your own admin account." });
    }
    if (role && role !== "admin") {
      return res.status(400).json({ error: "You cannot change your own admin role." });
    }
  }

  try {
    const userQuery = await pool.query(
      "SELECT * FROM utilisateur WHERE id = $1 LIMIT 1",
      [targetUserId]
    );
    const targetUser = userQuery.rows[0];

    if (!targetUser) {
      return res.status(404).json({ error: "User not found." });
    }

    let prenom = targetUser.prenom;
    let nom = targetUser.nom;
    let cleanEmail = targetUser.email;
    let mappedRole = targetUser.role;
    let active = targetUser.actif;
    let hashedPassword = targetUser.mot_de_passe;

    let logMessage = `Admin updated user '${targetUser.prenom} ${targetUser.nom}':`;

    if (username) {
      const parts = username.trim().split(/\s+/);
      prenom = parts[0] || "Utilisateur";
      nom = parts.slice(1).join(" ") || "CRM";
      if (prenom !== targetUser.prenom || nom !== targetUser.nom) {
        logMessage += ` Name updated to '${username}'.`;
      }
    }

    if (email && email.toLowerCase() !== targetUser.email.toLowerCase()) {
      cleanEmail = email.trim().toLowerCase();
      const existingEmail = await pool.query(
        "SELECT 1 FROM utilisateur WHERE LOWER(email) = $1 AND id != $2 LIMIT 1",
        [cleanEmail, targetUserId]
      );
      if (existingEmail.rows.length > 0) {
        return res.status(400).json({ error: "Email already registered." });
      }
      logMessage += ` Email updated to '${cleanEmail}'.`;
    }

    if (role) {
      const targetBackendRole = mapRoleToBackend(role);
      if (targetBackendRole !== targetUser.role) {
        mappedRole = targetBackendRole;
        logMessage += ` Role updated from '${targetUser.role}' to '${mappedRole}'.`;
      }
    }

    if (status) {
      const targetActive = status !== "disabled";
      if (targetActive !== targetUser.actif) {
        active = targetActive;
        logMessage += ` Status updated from '${targetUser.actif ? "active" : "disabled"}' to '${active ? "active" : "disabled"}'.`;
      }
    }

    if (password && password.trim().length > 0) {
      if (password.length < 6) {
        return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères." });
      }
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
      logMessage += ` Password was changed.`;
    }

    await pool.query(
      `UPDATE utilisateur 
       SET nom = $1, prenom = $2, email = $3, role = $4, actif = $5, mot_de_passe = $6
       WHERE id = $7`,
      [nom, prenom, cleanEmail, mappedRole, active, hashedPassword, targetUserId]
    );

    // Log the update
    await db.insert(activityLogs).values({
      userId: req.user!.id,
      username: req.user!.username,
      action: "UPDATE_USER",
      details: logMessage,
      ipAddress: ip,
    });

    res.json({ message: "User updated successfully." });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Failed to update user." });
  }
});

// Delete user
app.delete("/api/admin/users/:id", authenticateToken, requireAdmin, async (req: CustomRequest, res) => {
  const targetUserId = parseInt(req.params.id);
  const ip = req.ip || "127.0.0.1";

  if (isNaN(targetUserId)) {
    return res.status(400).json({ error: "Invalid user ID." });
  }

  if (targetUserId === req.user!.id) {
    return res.status(400).json({ error: "You cannot delete your own admin account." });
  }

  try {
    const userQuery = await pool.query(
      "SELECT * FROM utilisateur WHERE id = $1 LIMIT 1",
      [targetUserId]
    );
    const targetUser = userQuery.rows[0];

    if (!targetUser) {
      return res.status(404).json({ error: "User not found." });
    }

    await pool.query("DELETE FROM utilisateur WHERE id = $1", [targetUserId]);

    // Log deletion
    await db.insert(activityLogs).values({
      userId: req.user!.id,
      username: req.user!.username,
      action: "DELETE_USER",
      details: `Admin deleted user account '${targetUser.prenom} ${targetUser.nom}' (ID: ${targetUserId})`,
      ipAddress: ip,
    });

    res.json({ message: `User '${targetUser.prenom} ${targetUser.nom}' successfully deleted.` });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Failed to delete user." });
  }
});

// Get user activity logs
app.get("/api/admin/logs", authenticateToken, requireAdmin, async (req: CustomRequest, res) => {
  try {
    const logs = await db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(200); // return latest 200 security logs

    res.json(logs);
  } catch (error) {
    console.error("Get logs error:", error);
    res.status(500).json({ error: "Failed to fetch activity logs." });
  }
});

// Mount CRM routes protected by the auth middleware
app.use("/api/leads", authenticateToken, leadRouter);
app.use("/api/entreprises", authenticateToken, entrepriseRouter);
app.use("/api/tasks", authenticateToken, tacheRouter);
app.use("/api/devis", authenticateToken, devisRouter);
app.use("/api/notifications", authenticateToken, notificationRouter);
app.use("/api/kpis", authenticateToken, kpiRouter);


// --- VITE DEV / PRODUCTION BUILD HANDLER ---

async function startServer() {
  // Seed Database tables before starting listeners
  await seedDatabase();

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

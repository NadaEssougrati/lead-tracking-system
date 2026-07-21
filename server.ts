import express from "express";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createServer as createViteServer } from "vite";
import { db } from "./src/db/index.ts";
import { users, activityLogs } from "./src/db/schema.ts";
import { eq, desc, count, and } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "brutalist-secure-jwt-key-2026";

app.use(express.json());

// Seeding Helper
async function seedDatabase() {
  try {
    const userCountResult = await db.select({ val: count() }).from(users);
    const userCount = userCountResult[0]?.val ?? 0;
    if (userCount === 0) {
      console.log("No users found in database. Seeding initial test accounts...");
      const salt = await bcrypt.genSalt(10);
      
      const adminHash = await bcrypt.hash("admin123", salt);
      const managerHash = await bcrypt.hash("manager123", salt);
      const commercialHash = await bcrypt.hash("commercial123", salt);
      const marketingHash = await bcrypt.hash("marketing123", salt);
      const userHash = await bcrypt.hash("user123", salt);

      const insertedUsers = await db.insert(users).values([
        { username: "admin", email: "admin@example.com", password: adminHash, role: "admin", status: "active" },
        { username: "manager", email: "manager@example.com", password: managerHash, role: "manager", status: "active" },
        { username: "commercial", email: "commercial@example.com", password: commercialHash, role: "commercial", status: "active" },
        { username: "marketing", email: "marketing@example.com", password: marketingHash, role: "marketing", status: "active" },
        { username: "user", email: "user@example.com", password: userHash, role: "user", status: "active" },
      ]).returning();

      // Log creation
      for (const u of insertedUsers) {
        await db.insert(activityLogs).values({
          userId: u.id,
          username: u.username,
          action: "REGISTER",
          details: `System auto-seeded account with role: ${u.role}`,
          ipAddress: "127.0.0.1"
        });
      }
      console.log("Database seeded successfully!");
    } else {
      console.log(`Database has ${userCount} users. Skipping seeding.`);
    }
  } catch (error) {
    console.error("Failed to seed database:", error);
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
    
    // Fetch latest user info from DB to check for status and role changes
    const userList = await db.select().from(users).where(eq(users.id, decoded.id)).limit(1);
    const user = userList[0];

    if (!user) {
      return res.status(401).json({ error: "User no longer exists." });
    }

    if (user.status === "disabled") {
      return res.status(403).json({ error: "Account is disabled. Please contact an administrator." });
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
    };
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token." });
  }
};

const requireAdmin = (req: CustomRequest, res: express.Response, next: express.NextFunction) => {
  if (!req.user || req.user.role !== "admin") {
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
    return res.status(400).json({ error: "Username and password are required." });
  }

  try {
    // Find user by username or email
    const userList = await db
      .select()
      .from(users)
      .where(and(eq(users.username, username)))
      .limit(1);
    
    let user = userList[0];

    // Try finding by email if username doesn't match
    if (!user) {
      const emailList = await db
        .select()
        .from(users)
        .where(eq(users.email, username))
        .limit(1);
      user = emailList[0];
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    if (user.status === "disabled") {
      return res.status(403).json({ error: "Account is disabled. Please contact an administrator." });
    }

    // Verify Password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Log failed login attempt
      await db.insert(activityLogs).values({
        userId: user.id,
        username: user.username,
        action: "FAILED_LOGIN",
        details: "Failed login attempt: Invalid password.",
        ipAddress: ip,
      });
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Log login action
    await db.insert(activityLogs).values({
      userId: user.id,
      username: user.username,
      action: "LOGIN",
      details: `User logged in successfully from IP ${ip}`,
      ipAddress: ip,
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
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

  const requestedRole = role || "user";
  const validRoles = ["admin", "manager", "commercial", "marketing", "user"];
  if (!validRoles.includes(requestedRole)) {
    return res.status(400).json({ error: "Invalid role specified." });
  }

  try {
    // Check if username already exists
    const existingUser = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Username already taken." });
    }

    // Check if email already exists
    const existingEmail = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingEmail.length > 0) {
      return res.status(400).json({ error: "Email already registered." });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const newUserList = await db.insert(users).values({
      username,
      email,
      password: hashedPassword,
      role: requestedRole,
      status: "active",
    }).returning();

    const newUser = newUserList[0];

    // Log registration
    await db.insert(activityLogs).values({
      userId: newUser.id,
      username: newUser.username,
      action: "REGISTER",
      details: `User registered self-service with role: ${newUser.role}`,
      ipAddress: ip,
    });

    // Auto-login upon registration
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
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
  res.json({ user: req.user });
});


// --- ADMIN USER MANAGEMENT API ROUTES ---

// Get all users
app.get("/api/admin/users", authenticateToken, requireAdmin, async (req: CustomRequest, res) => {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
    
    res.json(allUsers);
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
    // Check constraints
    const existingUser = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Username already taken." });
    }

    const existingEmail = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingEmail.length > 0) {
      return res.status(400).json({ error: "Email already registered." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const inserted = await db.insert(users).values({
      username,
      email,
      password: hashedPassword,
      role,
      status: status || "active",
    }).returning();

    const createdUser = inserted[0];

    // Log admin action
    await db.insert(activityLogs).values({
      userId: req.user!.id,
      username: req.user!.username,
      action: "REGISTER",
      details: `Admin created user '${createdUser.username}' with role '${createdUser.role}' and status '${createdUser.status}'`,
      ipAddress: ip,
    });

    res.status(201).json({
      id: createdUser.id,
      username: createdUser.username,
      email: createdUser.email,
      role: createdUser.role,
      status: createdUser.status,
      createdAt: createdUser.createdAt,
    });
  } catch (error) {
    console.error("Admin user creation error:", error);
    res.status(500).json({ error: "Failed to create user." });
  }
});

// Edit user (role, status, email, username)
app.put("/api/admin/users/:id", authenticateToken, requireAdmin, async (req: CustomRequest, res) => {
  const targetUserId = parseInt(req.params.id);
  const { username, email, role, status } = req.body;
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
    const userList = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
    const targetUser = userList[0];

    if (!targetUser) {
      return res.status(404).json({ error: "User not found." });
    }

    const updates: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };

    let logMessage = `Admin updated user '${targetUser.username}':`;

    if (username && username !== targetUser.username) {
      const existingUser = await db.select().from(users).where(eq(users.username, username)).limit(1);
      if (existingUser.length > 0) {
        return res.status(400).json({ error: "Username already taken." });
      }
      updates.username = username;
      logMessage += ` Username updated to '${username}'.`;
    }

    if (email && email !== targetUser.email) {
      const existingEmail = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingEmail.length > 0) {
        return res.status(400).json({ error: "Email already registered." });
      }
      updates.email = email;
      logMessage += ` Email updated to '${email}'.`;
    }

    if (role && role !== targetUser.role) {
      updates.role = role;
      logMessage += ` Role updated from '${targetUser.role}' to '${role}'.`;
    }

    if (status && status !== targetUser.status) {
      updates.status = status;
      logMessage += ` Status updated from '${targetUser.status}' to '${status}'.`;
    }

    await db.update(users).set(updates).where(eq(users.id, targetUserId));

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
    const userList = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
    const targetUser = userList[0];

    if (!targetUser) {
      return res.status(404).json({ error: "User not found." });
    }

    await db.delete(users).where(eq(users.id, targetUserId));

    // Log deletion
    await db.insert(activityLogs).values({
      userId: req.user!.id,
      username: req.user!.username,
      action: "DELETE_USER",
      details: `Admin deleted user account '${targetUser.username}' (ID: ${targetUserId})`,
      ipAddress: ip,
    });

    res.json({ message: `User '${targetUser.username}' successfully deleted.` });
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

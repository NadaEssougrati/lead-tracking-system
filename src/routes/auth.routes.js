import express from "express";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";
import { safeUser, tokenFor, hashPassword } from "../lib/helpers.js";
import { authenticate, allowRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", authenticate, allowRoles("Administrateur"), async (req, res, next) => {
  try {
    const { nom, prenom, email, motDePasse, telephone, role = "Commercial" } = req.body;
    if (!nom || !prenom || !email || !motDePasse) {
      return res.status(400).json({ success: false, message: "nom, prenom, email et motDePasse sont requis." });
    }
    const user = await prisma.utilisateur.create({
      data: {
        nom,
        prenom,
        email: email.toLowerCase(),
        motDePasse: await hashPassword(motDePasse),
        telephone,
        role
      }
    });
    res.status(201).json({ success: true, data: safeUser(user) });
  } catch (e) {
    next(e);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, motDePasse } = req.body;
    const user = await prisma.utilisateur.findUnique({ where: { email: (email || "").toLowerCase() } });
    if (!user || !user.actif || !(await bcrypt.compare(motDePasse || "", user.motDePasse))) {
      return res.status(401).json({ success: false, message: "Email ou mot de passe incorrect." });
    }
    res.json({ success: true, data: { user: safeUser(user), accessToken: tokenFor(user) } });
  } catch (e) {
    next(e);
  }
});

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await prisma.utilisateur.findUnique({ where: { id: req.user.id } });
    res.json({ success: true, data: safeUser(user) });
  } catch (e) {
    next(e);
  }
});

export default router;

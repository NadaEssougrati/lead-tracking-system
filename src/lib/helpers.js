import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

export const safeUser = ({ motDePasse, ...user }) => user;

export const getSessionExpiresIn = () => {
  try {
    const configPath = path.resolve(process.cwd(), "src/lib/settings.json");
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (data.sessionLength) return data.sessionLength;
    }
  } catch (e) {
    // ignore
  }
  return process.env.JWT_EXPIRES_IN || "15m";
};

export const tokenFor = (user) => jwt.sign({ id:user.id, role:user.role, email:user.email }, process.env.JWT_SECRET, { expiresIn: getSessionExpiresIn() });
export const hashPassword = (password) => bcrypt.hash(password, 12);
export const leadInclude = { entreprise:true, commercial:{select:{id:true,nom:true,prenom:true,email:true,telephone:true}}, documents:true, _count:{select:{activites:true,taches:true,devis:true}} };

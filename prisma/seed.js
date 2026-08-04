import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import prisma from "../src/lib/prisma.js";

dotenv.config();

async function main() {
  const password = await bcrypt.hash("ChangeMe123!", 12);
  await prisma.utilisateur.upsert({
    where: { email: "admin@leedpro.com" },
    update: {},
    create: { 
      nom: "El Amrani", 
      prenom: "Nada", 
      email: "admin@leedpro.com", 
      motDePasse: password, 
      telephone: "+212600000001", 
      role: "Administrateur", 
      avatar: "" 
    }
  });
  console.log("Admin created: admin@leedpro.com / ChangeMe123!");
}
main().catch(console.error).finally(() => prisma.$disconnect());

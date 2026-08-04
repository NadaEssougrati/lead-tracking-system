require("dotenv").config();
const bcrypt = require("bcrypt");
const prisma = require("../src/lib/prisma");

async function main() {
  const password = await bcrypt.hash("ChangeMe123!", 12);
  await prisma.utilisateur.upsert({
    where: { email: "admin@leedpro.com" },
    update: {},
    create: { nom: "El Amrani", prenom: "Nada", email: "admin@leedpro.com", motDePasse: password, telephone: "+212600000001", role: "Administrateur", avatar: "" }
  });
  console.log("Admin created: admin@leedpro.com / ChangeMe123!");
}
main().catch(console.error).finally(() => prisma.$disconnect());

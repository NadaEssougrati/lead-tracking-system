const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const safeUser = ({ motDePasse, ...user }) => user;
const tokenFor = (user) => jwt.sign({ id:user.id, role:user.role, email:user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "15m" });
const hashPassword = (password) => bcrypt.hash(password, 12);
const leadInclude = { entreprise:true, commercial:{select:{id:true,nom:true,prenom:true,email:true,telephone:true}}, documents:true, _count:{select:{activites:true,taches:true,devis:true}} };
module.exports = { safeUser, tokenFor, hashPassword, leadInclude };

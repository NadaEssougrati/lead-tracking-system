require("dotenv").config();
const http = require("http");
const app = require("./app");
const prisma = require("./lib/prisma");

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
server.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));

async function shutdown() {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

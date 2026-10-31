import config from "./src/config/config.js"
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: config.databaseurl,
});

const prisma = new PrismaClient({
    adapter,
});

export default prisma;
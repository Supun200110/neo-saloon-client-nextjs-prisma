import { PrismaClient, Prisma } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

const userData: Prisma.UserCreateInput[] = [
    {
        email :"admin@example.com",
        firstName:"Admin",
        lastName:"Leo",
        password:"$2a$12$B//4sPH0WuuaVhs.S9qkQ.KuxEUnaPJXXCicre2/UNccBcZRwgtRm",
        role: "ADMIN",
        status: "ACTIVE",
        privileges:[]
    }
  
];

export async function main() {
  for (const u of userData) {
    await prisma.user.create({ data: u });
  }
}

main();
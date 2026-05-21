import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@voltix.com";
  const hashedPassword = await bcrypt.hash("Admin123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      name: "Admin User",
      role: "ADMIN",
      canAccessAdminCatalog: true,
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: "Admin User",
      role: "ADMIN",
      canAccessAdminCatalog: true,
    },
  });

  console.log(`✅ Default admin user upserted: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

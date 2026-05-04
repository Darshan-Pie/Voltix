/**
 * One-time migration script: assigns all existing ComponentPrice rows
 * (those with userId = "" from the schema migration default) to the
 * admin@voltix.com user, and sets that user's role to ADMIN.
 *
 * Run ONCE after: npx prisma db push
 *   node scripts/migrate-catalog-owner.js
 */

const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  // 1. Find (or verify) the admin user
  const admin = await db.user.findUnique({ where: { email: "admin@voltix.com" } });
  if (!admin) {
    console.error("❌  admin@voltix.com not found. Run scripts/seed-user.js first.");
    process.exit(1);
  }

  // 2. Promote the admin user's role to ADMIN and enable admin catalog access
  await db.user.update({
    where: { id: admin.id },
    data: { role: "ADMIN", canAccessAdminCatalog: true },
  });
  console.log(`✅  User ${admin.email} promoted to ADMIN role.`);

  // 3. Re-assign all orphaned catalog rows (userId = "") to the admin user
  const result = await db.componentPrice.updateMany({
    where: { userId: "" },
    data: { userId: admin.id },
  });
  console.log(`✅  ${result.count} catalog item(s) assigned to ${admin.email}.`);

  await db.$disconnect();
}

main().catch((e) => {
  console.error("❌  Migration failed:", e.message);
  db.$disconnect();
  process.exit(1);
});

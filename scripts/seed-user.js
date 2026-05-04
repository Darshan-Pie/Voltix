const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('voltix123', 12);
  try {
    const user = await db.user.create({
      data: {
        email: 'admin@voltix.com',
        password: hash,
        name: 'Admin',
      },
    });
    console.log('✅ User created:', user.email);
  } catch (e) {
    if (e.code === 'P2002') {
      console.log('ℹ️  User admin@voltix.com already exists — skipping.');
    } else {
      console.error('❌ Error:', e.message);
    }
  } finally {
    await db.$disconnect();
  }
}

main();

const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

db.user.update({
  where: { email: 'admin@voltix.com' },
  data: { role: 'ADMIN', canAccessAdminCatalog: true },
})
.then(u => console.log('✅ Promoted:', u.email, '→', u.role))
.catch(e => console.error('❌', e.message))
.finally(() => db.$disconnect());

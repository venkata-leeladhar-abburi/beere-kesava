const { PrismaClient } = require('./src/generated/prisma/client');
const prisma = new PrismaClient();
async function main() {
  const messages = await prisma.whatsAppMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(messages.map(m => ({ dest: m.destination, status: m.status, error: m.errorMessage })));
}
main().catch(console.error).finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function checkUser() {
    const user = await prisma.user.findUnique({ where: { email: 'admin@mui.or.id' } });
    console.log('User status for 2FA:', {
        email: user?.email,
        twoFactorEnabled: user?.twoFactorEnabled,
        twoFactorSecret: user?.twoFactorSecret ? 'Has Secret' : 'No Secret'
    });
}
checkUser().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=check-user.js.map
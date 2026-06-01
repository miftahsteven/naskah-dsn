import { prisma } from '../src/lib/prisma.js';
async function reset2FA() {
    const email = 'admin@mui.or.id';
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            console.log(`User dengan email ${email} tidak ditemukan.`);
            return;
        }
        await prisma.user.update({
            where: { id: user.id },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
            },
        });
        console.log(`Successfully reset 2FA for: ${email}`);
    }
    catch (error) {
        console.error('Error resetting 2FA:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
reset2FA();
//# sourceMappingURL=reset-2fa.js.map
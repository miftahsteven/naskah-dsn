import { prisma } from '../src/lib/prisma.js';
import jwt from 'jsonwebtoken';

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'miftahsteven@gmail.com' },
    include: { role: true }
  });
  if (!user) {
    console.log('User not found');
    return;
  }
  console.log('User found:', user.email, user.fullName, user.role.name);

  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, email: user.email, roleId: user.roleId },
    process.env.JWT_SECRET || 'super-secret-key-for-edocs-system-2026',
    { expiresIn: '1d' }
  );
  console.log('Generated JWT Token:');
  console.log(token);
  await prisma.$disconnect();
}

main().catch(console.error);

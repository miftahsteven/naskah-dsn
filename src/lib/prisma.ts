import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000, // 10 seconds timeout
});

// Add error logging for the pool
pool.on('error', (err) => {
  console.error('❌ Prisma Postgres Pool Error:', err);
});

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Add internal prisma error logging
(prisma as any).$on('error', (event: any) => {
  console.error('❌ Prisma Client Error:', event);
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const globalForPrisma = global as unknown as { prisma?: PrismaClient; pool?: Pool };

const pool = globalForPrisma.pool || new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // Max concurrent connections
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Fail fast after 5s
  allowExitOnIdle: true,
});

pool.on('error', (err) => {
  console.error('❌ Prisma Postgres Pool Error:', err);
});

globalForPrisma.pool = pool;

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

globalForPrisma.prisma = prisma;


import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const globalForPrisma = global as unknown as { prisma?: PrismaClient; pool?: Pool };

const pool = globalForPrisma.pool || new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  max: parseInt(process.env.DB_POOL_MAX || '10', 10), // Conservative pool size (10) for shared database host
  idleTimeoutMillis: 15000, // Release idle connections quickly (15s)
  connectionTimeoutMillis: 10000, // Wait up to 10s queue time under heavy request spikes
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


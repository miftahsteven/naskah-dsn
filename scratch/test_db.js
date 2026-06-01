import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
});

console.log('--- Database Connectivity Test ---');
console.log('Target:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@'));
console.log('Environment:', process.env.NODE_ENV);

try {
  console.log('Attempting to connect...');
  const client = await pool.connect();
  console.log('✅ Connected successfully!');
  
  const res = await client.query('SELECT NOW(), current_database(), current_user');
  console.log('✅ Query successful!');
  console.log('Result:', res.rows[0]);
  
  client.release();
} catch (err) {
  console.error('❌ Connection failed!');
  console.error('Error Message:', err.message);
  console.error('Error Code:', err.code);
  if (err.message.includes('timeout')) {
    console.log('\nPossible causes:');
    console.log('1. Database server is down');
    console.log('2. Firewall is blocking port 4825 on the server');
    console.log('3. Your local network/ISP is blocking port 4825');
    console.log('4. Incorrect IP or Port in .env');
  }
} finally {
  await pool.end();
  process.exit(0);
}

import { prisma } from '../src/lib/prisma.js';
import axios from 'axios';
import fs from 'fs';

async function main() {
  const doc = await prisma.document.findFirst({
    where: { documentNumber: { contains: '049/U-0643' } }
  });
  if (!doc) return console.log("Doc not found");

  const url = `http://localhost:3002/api/documents/${doc.id}/html`;
  try {
    const res = await axios.get(url, { headers: { Authorization: `Bearer ${process.env.ADMIN_TOKEN}` } });
    // Or just use the raw file since we know it's in the DB. Wait, no token!
  } catch (e) {}
}
main();

import { prisma } from '../src/lib/prisma.js';

function cleanJobTitle(rawTitle?: string | null): string {
  if (!rawTitle) return '';
  let clean = String(rawTitle).trim();

  if (clean.includes('/')) {
    clean = clean.split('/')[0].trim();
  }

  clean = clean.replace(/,+$/, '').trim();

  const lower = clean.toLowerCase();
  if (lower === 'chairman') clean = 'Ketua';
  else if (lower === 'vice chairman' || lower === 'vice chief') clean = 'Wakil Ketua';
  else if (lower === 'secretary') clean = 'Sekretaris';
  else if (lower === 'vice secretary') clean = 'Wakil Sekretaris';
  else if (lower === 'treasurer') clean = 'Bendahara';
  else if (lower === 'vice treasurer') clean = 'Wakil Bendahara';
  else if (lower === 'member') clean = 'Anggota';

  // Fix typo in "lndustri" if present
  clean = clean.replace(/Relasi lndustri/g, 'Relasi Industri');

  return clean;
}

async function main() {
  console.log('--- Cleaning Job Titles and Jabatan in Database ---');

  // 1. Rename any Jabatan that contains English translations
  const jabatansWithSlash = await prisma.jabatan.findMany({
    where: { name: { contains: '/' } },
  });

  console.log(`Found ${jabatansWithSlash.length} Jabatan records with slash:`);
  for (const j of jabatansWithSlash) {
    const cleanName = cleanJobTitle(j.name);
    // Check if a Jabatan with cleanName already exists
    const existingClean = await prisma.jabatan.findFirst({
      where: { name: cleanName },
    });

    if (existingClean && existingClean.id !== j.id) {
      console.log(`  Jabatan "${j.name}" -> points to existing clean Jabatan "${existingClean.name}" (${existingClean.id})`);
      // Re-link users pointing to j.id to existingClean.id
      const updatedUsers = await prisma.user.updateMany({
        where: { jabatanId: j.id },
        data: { jabatanId: existingClean.id },
      });
      console.log(`    Moved ${updatedUsers.count} users to Jabatan "${cleanName}"`);
      // Delete the redundant Jabatan with slash
      await prisma.jabatan.delete({ where: { id: j.id } });
      console.log(`    Deleted redundant Jabatan "${j.name}"`);
    } else {
      // No existing clean record, just rename this one
      const updated = await prisma.jabatan.update({
        where: { id: j.id },
        data: { name: cleanName },
      });
      console.log(`  Renamed Jabatan "${j.name}" -> "${updated.name}"`);
    }
  }

  // 2. Clean User jobTitles
  const usersWithSlash = await prisma.user.findMany({
    where: { jobTitle: { contains: '/' } },
    select: { id: true, fullName: true, jobTitle: true, jabatanId: true },
  });

  console.log(`\nFound ${usersWithSlash.length} Users with slash in jobTitle:`);
  for (const u of usersWithSlash) {
    const cleaned = cleanJobTitle(u.jobTitle);
    // Find matching Jabatan if any
    const matchingJabatan = await prisma.jabatan.findFirst({
      where: { name: cleaned },
    });

    await prisma.user.update({
      where: { id: u.id },
      data: {
        jobTitle: cleaned,
        ...(matchingJabatan && { jabatanId: matchingJabatan.id }),
      },
    });
    console.log(`  ✓ Updated user "${u.fullName}": "${u.jobTitle}" -> "${cleaned}"`);
  }

  console.log('\n--- Done cleaning database job titles! ---');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error running script:', err);
  process.exit(1);
});

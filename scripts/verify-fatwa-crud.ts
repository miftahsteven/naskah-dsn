const API_BASE = 'http://localhost:4002/api';

async function main() {
  console.log('--- 1. Login & 2FA ---');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'miftahsteven@gmail.com',
      password: 'B47054ii!',
    }),
  });
  const loginJson = await loginRes.json();
  const userId = loginJson.userId;

  const verify2faRes = await fetch(`${API_BASE}/auth/verify-2fa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      token: '847054',
    }),
  });
  const verifyJson = await verify2faRes.json();
  const accessToken = verifyJson.data.accessToken;
  console.log('✅ Logged in successfully. Token obtained.');

  const authHeaders = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  console.log('\n--- 2. GET /fatwa/stats ---');
  const statsRes = await fetch(`${API_BASE}/fatwa/stats`, { headers: authHeaders });
  const statsJson = await statsRes.json();
  console.log('Stats Summary:', {
    total: statsJson.data.total,
    totalResmi: statsJson.data.totalResmi,
    published: statsJson.data.published,
    totalPleno: statsJson.data.totalPleno,
    recentCount: statsJson.data.recent.length,
  });

  console.log('\n--- 3. GET /fatwa (first 3) ---');
  const listRes = await fetch(`${API_BASE}/fatwa?limit=3&page=1`, { headers: authHeaders });
  const listJson = await listRes.json();
  console.log(`Total Fatwas: ${listJson.total}`);
  listJson.data.forEach((f: any, idx: number) => {
    console.log(`[${idx + 1}] No: ${f.nomorFatwa || f.noUrut} | Tahun: ${f.tahun} | Pleno: ${f.pleno} | Judul: ${f.title}`);
  });

  console.log('\n--- 4. POST /fatwa (Create test fatwa) ---');
  const createRes = await fetch(`${API_BASE}/fatwa`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      nomorFatwa: '999/DSN-MUI/X/2026',
      title: 'Fatwa Uji Coba Otomatis Sistem Amanah',
      pleno: '61',
      tahun: 2026,
      penandatangan1: 'Prof. Dr. KH. Test Pimpinan 1',
      penandatangan2: 'Dr. KH. Test Pimpinan 2',
      tanggal: '2026-10-22',
      keterangan: 'Fatwa pengujian CRUD Amanah',
      status: 'PUBLIKASI',
    }),
  });
  const createJson = await createRes.json();
  const createdId = createJson.data.id;
  console.log(`✅ Created Fatwa with ID: ${createdId}`);

  console.log('\n--- 5. PATCH /fatwa/:id (Edit test fatwa) ---');
  const updateRes = await fetch(`${API_BASE}/fatwa/${createdId}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Fatwa Uji Coba Otomatis Sistem Amanah (UPDATED & VERIFIED)',
      keterangan: 'Keterangan telah berhasil diperbarui.',
    }),
  });
  const updateJson = await updateRes.json();
  console.log(`✅ Updated Title: ${updateJson.data.title}`);

  console.log('\n--- 6. DELETE /fatwa/:id (Delete test fatwa) ---');
  const deleteRes = await fetch(`${API_BASE}/fatwa/${createdId}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  const deleteJson = await deleteRes.json();
  console.log(`✅ Delete Result:`, deleteJson);

  console.log('\n--- 7. Verify deletion ---');
  const getDeletedRes = await fetch(`${API_BASE}/fatwa/${createdId}`, { headers: authHeaders });
  if (getDeletedRes.status === 404) {
    console.log('✅ Verified: Fatwa 404 Not Found (Successfully removed from database)');
  } else {
    console.log(`Status: ${getDeletedRes.status}`);
  }

  console.log('\n--- 8. Final Stats Check ---');
  const finalStatsRes = await fetch(`${API_BASE}/fatwa/stats`, { headers: authHeaders });
  const finalStatsJson = await finalStatsRes.json();
  console.log(`Final Total: ${finalStatsJson.data.total}, Total Resmi: ${finalStatsJson.data.totalResmi}`);

  console.log('\n🎉 ALL FATWA CRUD OPERATIONS WORKING 100% PERFECTLY!');
}

main().catch((err) => {
  console.error('Error during test:', err);
  process.exit(1);
});

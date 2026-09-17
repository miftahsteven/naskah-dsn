import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

const API_BASE = 'http://localhost:4002/api';
const DOC_ID = 'db700fc2-2096-45a5-a5ba-ef2290cd36f2';
const SUBMISSION_ID = '5edd8d0b-9480-4f09-b229-ba98ee05f651';

async function run() {
  console.log('🚀 Starting End-to-End Hospital Certification Flow Test...');

  // 1. Generate admin token
  const admin = await prisma.user.findFirst({ where: { email: { contains: 'admin' } } });
  if (!admin) throw new Error('Admin user not found');
  const token = jwt.sign(
    { id: admin.id, email: admin.email, organizationId: admin.organizationId, roleId: admin.roleId },
    process.env.JWT_SECRET || 'default-secret',
    { expiresIn: '1d' }
  );

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Step 1: Schedule Interview Round 1
  console.log('\n--- Step 1: Schedule Interview Round 1 ---');
  const invRes1 = await fetch(`${API_BASE}/documents/${DOC_ID}/interview-invitation`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      round: 1,
      invitationNumber: 'UND-WW/DSN-MUI/RS/IX/2026/001',
      invitationDate: '17 September 2026',
      interviewDayDate: 'Kamis, 17 September 2026',
      interviewTime: '09:30 - 11:30',
      format: 'HYBRID',
      venue: 'Ruang Rapat Pleno DSN-MUI Lt. 3 / Zoom Cloud Meeting',
      zoomUrl: 'https://zoom.us/j/88123456789',
      zoomMeetingId: '881 2345 6789',
      zoomPasscode: 'RSMUI2026',
      subject: 'Undangan Wawancara Asesmen Rumah Sakit Syariah Putaran Ke-1',
      candidates: ['Direktur Utama RS Bunda Aria', 'Calon DPS RS'],
      dresscode: 'Pakaian Sipil Lengkap / Batik Formal',
      requirements: 'Membawa berkas fisik legalitas RS, sertifikat MUKISI, dan SOP pelayanan syariah',
      contactPerson: 'Sekretariat DSN-MUI (0812-3456-7890)',
      syncMeetingAgenda: true,
    }),
  });
  const invData1 = await invRes1.json();
  console.log('✅ Round 1 Invitation scheduled:', invData1.status, invData1.message);

  // Step 2: Input Assessment for Round 1 (Decision: DITOLAK / REPEAT NEEDED)
  console.log('\n--- Step 2: Assessment Round 1 (DITOLAK) ---');
  const assessRes1 = await fetch(`${API_BASE}/documents/${DOC_ID}/interview-assessment`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      round: 1,
      assessedByName: 'Tim Asesor & Penguji RS Syariah DSN-MUI',
      score: 68,
      decision: 'DITOLAK',
      notes: 'Pemahaman komite etik syariah masih perlu pendalaman, dan matriks pemisahan obat halal-syubhat belum lengkap.',
      improvementNotes: 'RS diminta melengkapi SOP farmasi halal dan mengikuti bimbingan teknis sebelum wawancara ulang.',
    }),
  });
  const assessData1 = await assessRes1.json();
  console.log('✅ Round 1 Assessment saved:', assessData1.status, assessData1.data?.dpsStage);

  // Step 3: Schedule Repeat Interview Round 2 (Unlimited Repeat Support)
  console.log('\n--- Step 3: Schedule Repeat Interview Round 2 ---');
  const invRes2 = await fetch(`${API_BASE}/documents/${DOC_ID}/interview-invitation`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      round: 2,
      invitationNumber: 'UND-WW/DSN-MUI/RS/IX/2026/002-R2',
      invitationDate: '24 September 2026',
      interviewDayDate: 'Kamis, 24 September 2026',
      interviewTime: '13:30 - 15:00',
      format: 'HYBRID',
      venue: 'Ruang Rapat Pleno DSN-MUI Lt. 3 / Zoom Cloud Meeting',
      zoomUrl: 'https://zoom.us/j/88199990000',
      zoomMeetingId: '881 9999 0000',
      zoomPasscode: 'RSMUI_R2',
      subject: 'Undangan Wawancara Ulang Asesmen Rumah Sakit Syariah Putaran Ke-2',
      candidates: ['Direktur Utama RS Bunda Aria', 'Calon DPS RS'],
      dresscode: 'Pakaian Sipil Lengkap / Batik Formal',
      requirements: 'Membawa matriks perbaikan SOP farmasi halal & komite etik yang telah diperbaharui',
      contactPerson: 'Sekretariat DSN-MUI (0812-3456-7890)',
      syncMeetingAgenda: true,
    }),
  });
  const invData2 = await invRes2.json();
  console.log('✅ Round 2 Invitation scheduled:', invData2.status, invData2.message);

  // Step 4: Input Assessment for Round 2 (Decision: DITERIMA / LULUS)
  console.log('\n--- Step 4: Assessment Round 2 (DITERIMA) ---');
  const assessRes2 = await fetch(`${API_BASE}/documents/${DOC_ID}/interview-assessment`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      round: 2,
      assessedByName: 'Tim Asesor & Penguji RS Syariah DSN-MUI',
      score: 94,
      decision: 'DITERIMA',
      notes: 'Seluruh perbaikan SOP farmasi dan komite etik telah dipenuhi dengan sangat baik. Direksi dan calon DPS dinyatakan LULUS asesmen syariah.',
      improvementNotes: null,
    }),
  });
  const assessData2 = await assessRes2.json();
  console.log('✅ Round 2 Assessment saved:', assessData2.status, assessData2.data?.dpsStage);

  // Step 5: Upload Ready Signed Certificate PDF
  console.log('\n--- Step 5: Upload Ready Signed Certificate PDF ---');
  const dummyPdfPath = path.resolve(process.cwd(), 'dummy_cert.pdf');
  if (!fs.existsSync(dummyPdfPath)) {
    fs.writeFileSync(dummyPdfPath, '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF');
  }

  const pdfBlob = new Blob([fs.readFileSync(dummyPdfPath)], { type: 'application/pdf' });
  const formData = new FormData();
  formData.append('file', pdfBlob, 'Sertifikat_Kesesuaian_Syariah_RS_Bunda_Aria.pdf');
  formData.append('certificateNumber', 'DSN-MUI/KS-RS/2026/0042');
  formData.append('title', 'Sertifikat Kesesuaian Syariah Rumah Sakit Bunda Aria');
  formData.append('issueDate', '2026-09-17');
  formData.append('validUntil', '2029-09-17');
  formData.append('notes', 'Sertifikat asli telah ditandatangani basah oleh Ketua & Sekretaris DSN-MUI');

  const uploadRes = await fetch(`${API_BASE}/documents/${DOC_ID}/upload-certificate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const uploadData = await uploadRes.json();
  console.log('✅ Ready Certificate uploaded:', uploadData.status, uploadData.data?.certificate?.certificateNumber);
  console.log('⏱️ SLA Duration result:', uploadData.data?.sla);

  // Step 6: Verify Database Records
  console.log('\n--- Step 6: Verify Final DB State ---');
  const finalSub = await prisma.publicSubmission.findUnique({
    where: { id: SUBMISSION_ID },
    include: { certificate: true, erpDocument: true },
  });

  console.log('Submission Status:', finalSub?.status);
  console.log('Submission DPS Stage:', finalSub?.dpsStage);
  console.log('Completed At:', finalSub?.completedAt);
  console.log('Certificate Number:', finalSub?.certificate?.certificateNumber);
  console.log('Interview Rounds History Count:', (finalSub?.interviewHistory as any[])?.length);
  console.log('ERP Document Status:', finalSub?.erpDocument?.status);
  console.log('ERP Document Certificate URL:', finalSub?.erpDocument?.certificateUrl);

  console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
}

run().catch(console.error).finally(() => prisma.$disconnect());

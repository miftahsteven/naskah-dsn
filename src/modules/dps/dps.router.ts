import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';
import type { AuthRequest } from '../../middleware/auth.js';

const router = Router();

// ── GET ALL DPS MEMBERS ──
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const list = await prisma.dpsMember.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ status: 'success', data: list });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── GET DPS MEMBER BY ID ──
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const member = await prisma.dpsMember.findUnique({
      where: { id: String(id) },
    });
    if (!member) {
      return res.status(404).json({ status: 'error', message: 'Anggota DPS tidak ditemukan' });
    }
    res.json({ status: 'success', data: member });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── CREATE DPS MEMBER ──
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const {
      status,
      jenisPenugasan,
      tanggalPengajuan,
      namaLengkap,
      fotoUrl,
      tempatLahir,
      tanggalLahir,
      jenisKelamin,
      kewarganegaraan,
      agama,
      npwp,
      alamatDomisili,
      rtRw,
      kelurahan,
      kecamatan,
      kotaKabupaten,
      provinsi,
      kodePos,
      noTelepon,
      noHp,
      email,
      pendidikanTerakhir,
      perguruanTinggi,
      tahunLulus,
      lembagaPenempatan,
      jabatanDps,
      skPengangkatan,
      tanggalSk,
      masaJabatanMulai,
      masaJabatanSelesai,
      riwayatJabatan,
      sertifikatPelatihan,
      bidangKeahlian,
      pengalamanProfesional,
      dokumenFiles,
    } = req.body;

    if (!namaLengkap || !status || !jenisPenugasan || !tanggalPengajuan || !email) {
      return res.status(400).json({ status: 'error', message: 'Field namaLengkap, status, jenisPenugasan, tanggalPengajuan, dan email wajib diisi.' });
    }

    const newMember = await prisma.dpsMember.create({
      data: {
        status,
        jenisPenugasan,
        tanggalPengajuan,
        namaLengkap,
        fotoUrl: fotoUrl || null,
        tempatLahir: tempatLahir || '',
        tanggalLahir: tanggalLahir || '',
        jenisKelamin: jenisKelamin || '',
        kewarganegaraan: kewarganegaraan || '',
        agama: agama || 'Islam',
        npwp: npwp || '',
        alamatDomisili: alamatDomisili || '',
        rtRw: rtRw || '',
        kelurahan: kelurahan || '',
        kecamatan: kecamatan || '',
        kotaKabupaten: kotaKabupaten || '',
        provinsi: provinsi || '',
        kodePos: kodePos || '',
        noTelepon: noTelepon || '',
        noHp: noHp || '',
        email,
        pendidikanTerakhir: pendidikanTerakhir || '',
        perguruanTinggi: perguruanTinggi || '',
        tahunLulus: tahunLulus || '',
        lembagaPenempatan: lembagaPenempatan || null,
        jabatanDps: jabatanDps || null,
        skPengangkatan: skPengangkatan || null,
        tanggalSk: tanggalSk || null,
        masaJabatanMulai: masaJabatanMulai || null,
        masaJabatanSelesai: masaJabatanSelesai || null,
        riwayatJabatan: riwayatJabatan || [],
        sertifikatPelatihan: sertifikatPelatihan || [],
        bidangKeahlian: bidangKeahlian || [],
        pengalamanProfesional: pengalamanProfesional || '',
        dokumenFiles: dokumenFiles || [],
      },
    });

    res.status(201).json({ status: 'success', data: newMember });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── UPDATE DPS MEMBER ──
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const existing = await prisma.dpsMember.findUnique({
      where: { id: String(id) },
    });
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Anggota DPS tidak ditemukan' });
    }

    const updated = await prisma.dpsMember.update({
      where: { id: String(id) },
      data: {
        ...updateData,
        // Make sure dates / jsons are correctly mapped if they are passed in body
      },
    });

    res.json({ status: 'success', data: updated });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── DELETE DPS MEMBER ──
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.dpsMember.findUnique({
      where: { id: String(id) },
    });
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Anggota DPS tidak ditemukan' });
    }

    await prisma.dpsMember.delete({
      where: { id: String(id) },
    });

    res.json({ status: 'success', message: 'Data anggota DPS berhasil dihapus.' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;

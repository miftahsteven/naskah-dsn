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
      include: {
        company: {
          select: { id: true, name: true, legalType: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ status: 'success', data: list });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── GET COMPANIES FOR DPS ASSIGNMENT ──
router.get('/companies', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const list = await prisma.company.findMany({
      select: { id: true, name: true, legalType: true, email: true, phone: true },
      orderBy: { name: 'asc' },
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
      include: {
        company: {
          select: { id: true, name: true, legalType: true, email: true, phone: true }
        }
      }
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
      namaNonGelar,
      statusDiMui,
      nik,
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
      companyId,
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
      aspm,
      wajibIkutPelatihan,
      nomorVirtualAccount,
      nomorSertifikatPelatihan,
      linkSertifikatPelatihan,
      nomorSertifikatLsp,
      linkSertifikatLsp,
      tanggalPaktaIntegritas,
      linkPaktaIntegritas,
      keterangan,
      externalId,
    } = req.body;

    if (!namaLengkap || !status || !jenisPenugasan) {
      return res.status(400).json({ status: 'error', message: 'Field namaLengkap, status, dan jenisPenugasan wajib diisi.' });
    }

    // Auto-set lembagaPenempatan if companyId is provided and lembagaPenempatan is not
    let finalLembaga = lembagaPenempatan || null;
    if (companyId && !finalLembaga) {
      const comp = await prisma.company.findUnique({ where: { id: companyId }, select: { name: true } });
      if (comp) finalLembaga = comp.name;
    }

    const newMember = await prisma.dpsMember.create({
      data: {
        status,
        jenisPenugasan,
        tanggalPengajuan: tanggalPengajuan || tanggalPaktaIntegritas || null,
        namaLengkap,
        namaNonGelar: namaNonGelar || null,
        statusDiMui: statusDiMui || null,
        nik: nik || null,
        fotoUrl: fotoUrl || null,
        tempatLahir: tempatLahir || null,
        tanggalLahir: tanggalLahir || null,
        jenisKelamin: jenisKelamin || null,
        kewarganegaraan: kewarganegaraan || null,
        agama: agama || null,
        npwp: npwp || null,
        alamatDomisili: alamatDomisili || null,
        rtRw: rtRw || null,
        kelurahan: kelurahan || null,
        kecamatan: kecamatan || null,
        kotaKabupaten: kotaKabupaten || null,
        provinsi: provinsi || null,
        kodePos: kodePos || null,
        noTelepon: noTelepon || null,
        noHp: noHp || null,
        email: email || null,
        pendidikanTerakhir: pendidikanTerakhir || null,
        perguruanTinggi: perguruanTinggi || null,
        tahunLulus: tahunLulus || null,
        companyId: companyId || null,
        lembagaPenempatan: finalLembaga,
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
        aspm: aspm || null,
        wajibIkutPelatihan: wajibIkutPelatihan || null,
        nomorVirtualAccount: nomorVirtualAccount || null,
        nomorSertifikatPelatihan: nomorSertifikatPelatihan || null,
        linkSertifikatPelatihan: linkSertifikatPelatihan || null,
        nomorSertifikatLsp: nomorSertifikatLsp || null,
        linkSertifikatLsp: linkSertifikatLsp || null,
        tanggalPaktaIntegritas: tanggalPaktaIntegritas || null,
        linkPaktaIntegritas: linkPaktaIntegritas || null,
        keterangan: keterangan || null,
        externalId: externalId || null,
      },
      include: {
        company: {
          select: { id: true, name: true, legalType: true }
        }
      }
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

    if (updateData.companyId && !updateData.lembagaPenempatan) {
      const comp = await prisma.company.findUnique({ where: { id: updateData.companyId }, select: { name: true } });
      if (comp) updateData.lembagaPenempatan = comp.name;
    }

    const updated = await prisma.dpsMember.update({
      where: { id: String(id) },
      data: {
        ...updateData,
      },
      include: {
        company: {
          select: { id: true, name: true, legalType: true }
        }
      }
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

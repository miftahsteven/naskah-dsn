import { prisma } from '../src/lib/prisma.js';
import fs from 'fs';
import path from 'path';
import * as qrcode from 'qrcode';

function injectSignatureQrIntoHtml(htmlContent: string, row: any, baseUrl: string) {
  const candidates = row.candidates || [];
  let match: RegExpExecArray | null = null;
  let matchedCandidate = "";

  for (const cand of candidates) {
    const tokens = cand.split(/\s+/).filter((t: string) => t.length > 2);
    if (tokens.length > 0) {
      let patternStr = tokens.join('(?:<[^>]+>|\\s|&nbsp;|&#160;)+');
      const nameRegex = new RegExp(patternStr, 'i');
      match = nameRegex.exec(htmlContent);
      if (match) {
        matchedCandidate = cand;
        break;
      }
    }
  }

  const qrImageHtml = `<div style="text-align:center; margin:4px auto; line-height:1; display:block; position:relative; width:70px; height:70px;"><img src="${row.qrDataUrl}" alt="QR Signature" class="qr-signature-img" style="width:70px !important; height:70px !important; min-width:70px !important; min-height:70px !important; object-fit:contain !important; display:block !important; position:absolute; top:0; left:0; z-index:1;" /><img src="${baseUrl}/images/logo-dsn.png" alt="Logo" style="width:20px !important; height:20px !important; position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); z-index:2; background:#fff; border-radius:50%; padding:2px; object-fit:contain; border:1px solid #1F3F23;" /></div>`;

  if (match) {
    const matchIndex = match.index;
    const prefix = htmlContent.substring(0, matchIndex);

    const lastOpenTagIndex = prefix.lastIndexOf('<');
    let targetIndex = matchIndex;
    if (lastOpenTagIndex !== -1) {
      const tagSub = prefix.substring(lastOpenTagIndex);
      if (/^<(div|p|u|b|strong|span)[^>]*>/i.test(tagSub)) {
        targetIndex = lastOpenTagIndex;
      }
    }

    const realPrefix = htmlContent.substring(0, targetIndex);
    let suffix = htmlContent.substring(targetIndex);
    suffix = suffix.replace(/^([^>]+style="[^"]*)(?:margin-top|padding-top):\s*\d+px;?/i, "$1margin-top: 2px;");

    const sliceLen = Math.min(1000, realPrefix.length);
    const prefixBase = realPrefix.slice(0, realPrefix.length - sliceLen);
    const lastSlice = realPrefix.slice(realPrefix.length - sliceLen);

    if (/margin-bottom:\s*\d+px/i.test(lastSlice)) {
      const updatedSlice = lastSlice.replace(/margin-bottom:\s*\d+px/gi, 'margin-bottom: 4px');
      return { html: prefixBase + updatedSlice + qrImageHtml + suffix, injected: true };
    } else if (/(<div[^>]*style="[^"]*height:[^"]*"[^>]*>\s*<\/div>)/gi.test(lastSlice)) {
      const updatedSlice = lastSlice.replace(/(<div[^>]*style="[^"]*height:[^"]*"[^>]*>\s*<\/div>)/gi, qrImageHtml);
      return { html: prefixBase + updatedSlice + suffix, injected: true };
    } else if (/(?:<br\s*\/?>\s*){2,}/i.test(lastSlice)) {
      const updatedSlice = lastSlice.replace(/(?:<br\s*\/?>\s*){2,}/gi, qrImageHtml);
      return { html: prefixBase + updatedSlice + suffix, injected: true };
    } else {
      return { html: realPrefix + qrImageHtml + suffix, injected: true };
    }
  }

  if (/margin-bottom:\s*\d+px/i.test(htmlContent)) {
    const updated = htmlContent.replace(/margin-bottom:\s*\d+px/i, (m) => "margin-bottom: 4px;" + qrImageHtml);
    return { html: updated, injected: true };
  }
  return { html: htmlContent, injected: false };
}

async function main() {
  const doc = await prisma.document.findFirst({
    where: { documentNumber: { contains: '050/U-0643' } },
    include: { versions: { orderBy: { versionNum: 'desc' } }, signatures: { include: { user: true } }, workflowInstances: { include: { steps: { include: { user: true } } } } }
  });
  if (!doc) return console.log("Doc not found");

  const version = doc.versions[0];
  const filePath = path.join(process.cwd(), version.fileUrl);
  
  if (!fs.existsSync(filePath)) {
    return console.log("File not found locally:", filePath);
  }

  let htmlContent = fs.readFileSync(filePath, 'utf8');
  
  const allSignatures = [...doc.signatures];
  if (doc.workflowInstances) {
    doc.workflowInstances.forEach((wf) => {
      wf.steps.forEach((st) => {
        if (st.status === 'APPROVED' && st.userId) {
          allSignatures.push({
            id: st.id,
            documentId: doc.id,
            userId: st.userId,
            signedAt: st.actionedAt || st.updatedAt || new Date(),
            user: st.user
          });
        }
      });
    });
  }
  
  const signedSigs = allSignatures.filter((s: any) => s.signedAt);
  const signatureRows = await Promise.all(signedSigs.map(async (s: any) => {
    const payload = doc.documentNumber || s.documentId;
    const qrDataUrl = await qrcode.toDataURL(payload);
    
    const candidates: string[] = [];
    if (s.user?.fullName) {
      candidates.push(s.user.fullName);
      const cleanName = s.user.fullName
        .replace(/\b(Dr|K\.?H|Prof|Drs|H|Lc|Ph\.?D|M\.?A|S\.?H|M\.?Si|Ir|M\.?Ag|S\.?Ag|S\.?E)\b\.?/gi, '')
        .replace(/[\s,.]+/g, ' ')
        .trim();
      if (cleanName && cleanName.length >= 3) {
        candidates.push(cleanName);
      }
    }
    return { ...s, qrDataUrl, candidates };
  }));

  signatureRows.forEach(row => {
    const res = injectSignatureQrIntoHtml(htmlContent, row, 'http://localhost:3002');
    if (res.injected) {
      htmlContent = res.html;
    }
  });

  console.log("QR Injected?", htmlContent.includes('qr-signature-img'));
  const match = htmlContent.match(/<div [^>]*class="qr-signature-img"/);
  if (match) {
    console.log("Injected HTML snippet:\n", htmlContent.substring(match.index - 50, match.index + 200));
  } else {
    const idx = htmlContent.indexOf('qr-signature-img');
    if (idx !== -1) {
      console.log("Found class at:", idx, "\n", htmlContent.substring(idx - 100, idx + 100));
    } else {
      console.log("No QR class found!");
    }
  }
}
main();

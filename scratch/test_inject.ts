import fs from 'fs';

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function injectSignatureQrIntoHtml(htmlContent: string, row: any, baseUrl: string) {
  const candidates = row.candidates || [];
  let match: RegExpExecArray | null = null;
  let matchedCandidate = "";

  let bestMatch: { m: RegExpExecArray, cand: string, score: number, index: number } | null = null;

  for (const cand of candidates) {
    const tokens = cand
      .split(/[\s,.]+/)
      .filter((t: string) => t.length >= 3 && !/^(dr|kh|prof|drs|h|lc|phd|ma|sh|mag|msi|ir|se|ag)$/i.test(t));
    
    if (tokens.length > 0) {
      // Allow up to 80 chars of any tags/text between tokens (e.g. middle names, titles, HTML tags)
      const patternStr = tokens.map((t: string) => escapeRegExp(t)).join('[\\s\\S]{0,80}?');
      const nameRegex = new RegExp(patternStr, 'gi'); 
      let m: RegExpExecArray | null;
      
      while ((m = nameRegex.exec(htmlContent)) !== null) {
        const prefix = htmlContent.substring(0, m.index);
        const lastSlice = prefix.slice(Math.max(0, prefix.length - 350));
        
        let score = 0;
        // Signature blocks usually have "Ketua", "Sekretaris", or "Direktur" closely before the name
        if (/(Ketua|Sekretaris|Direktur|Pimpinan|Kepala)/i.test(lastSlice)) score += 15;
        // Signature blocks usually have large gaps before the name
        if (/(?:<br\s*\/?>\s*){2,}/i.test(lastSlice)) score += 5;
        if (/margin-bottom:\s*\d+px/i.test(lastSlice)) score += 5;
        if (/<div[^>]*style="[^"]*height/i.test(lastSlice)) score += 5;
        // If it's a list item (like in Lampiran: "Sekretaris : Dr..."), penalize heavily!
        if (/:\s*(<[^>]+>\s*)*$/.test(lastSlice) || /:\s*$/.test(prefix.trim())) score -= 25;
        
        if (!bestMatch || score > bestMatch.score || (score === bestMatch.score && m.index > bestMatch.index)) {
          bestMatch = { m, cand, score, index: m.index };
        }
      }
    }
  }

  if (bestMatch && bestMatch.score > -10) {
    match = bestMatch.m;
    matchedCandidate = bestMatch.cand;
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
    } else {
      const lastBrMatches = [...lastSlice.matchAll(/(?:<br\s*\/?>\s*){2,}/gi)];
      if (lastBrMatches.length > 0) {
        const lastBrMatch = lastBrMatches[lastBrMatches.length - 1];
        if (lastBrMatch && typeof lastBrMatch.index === 'number') {
          const bPrefix = lastSlice.substring(0, lastBrMatch.index);
          const bSuffix = lastSlice.substring(lastBrMatch.index + lastBrMatch[0].length);
          const updatedSlice = bPrefix + qrImageHtml + bSuffix;
          return { html: prefixBase + updatedSlice + suffix, injected: true };
        }
      }
      return { html: realPrefix + qrImageHtml + suffix, injected: true };
    }
  }

  const isKetua = row.signerIndex === 0 || /ketua/i.test(row.roleName || '');
  const targetRole = isKetua ? 'Ketua' : 'Sekretaris';
  
  const roleRegex = new RegExp(`(${targetRole}\\s*,?\\s*(?:<[^>]+>|\\s)*?)(?:<br\\s*\\/?>\\s*){2,}`, 'i');
  if (roleRegex.test(htmlContent)) {
    const updated = htmlContent.replace(roleRegex, `$1${qrImageHtml}`);
    return { html: updated, injected: true };
  }

  const genericRoleRegex = /(?:Ketua|Sekretaris)\s*,?\s*(?:<[^>]+>|\s)*?/i;
  const roleMatch = genericRoleRegex.exec(htmlContent);
  if (roleMatch) {
    const idx = roleMatch.index + roleMatch[0].length;
    const prefix = htmlContent.substring(0, idx);
    const suffix = htmlContent.substring(idx);
    return { html: prefix + qrImageHtml + suffix, injected: true };
  }

  return { html: htmlContent, injected: false };
}

let html = fs.readFileSync('scratch/original.html', 'utf8');
const rowAmirsyah = {
  candidates: ["AMIRSYAH TAMBUNAN"],
  signerIndex: 1,
  roleName: 'Sekretaris',
  qrDataUrl: 'data:image/png;base64,1234'
};
const rowCholil = {
  candidates: ["CHOLIL NAFIS"],
  signerIndex: 0,
  roleName: 'Ketua',
  qrDataUrl: 'data:image/png;base64,1234'
};
let res1 = injectSignatureQrIntoHtml(html, rowAmirsyah, 'http://localhost');
if(res1.injected) html = res1.html;
let res2 = injectSignatureQrIntoHtml(html, rowCholil, 'http://localhost');
if(res2.injected) html = res2.html;
fs.writeFileSync('scratch/injected.html', html);
console.log("Done");

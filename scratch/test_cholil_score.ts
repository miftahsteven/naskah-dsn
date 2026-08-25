import fs from 'fs';

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

try {
  const rawHtml = fs.readFileSync('uploads/file-1787651553591-620447957.html', 'utf8');

  // Let's test the scoring for Cholil Nafis candidates:
  const candidates = ['K.H. M. Cholil Nafis, Lc., Ph.D.', 'Cholil Nafis', 'K.H. M. CHOLIL NAFIS, Lc., Ph.D.', 'CHOLIL NAFIS', 'HASANUDDIN'];

  for (const cand of candidates) {
    const tokens = cand
      .split(/[\s,.]+/)
      .filter((t) => t.length >= 3 && !/^(dr|kh|prof|drs|h|lc|phd|ma|sh|mag|msi|ir|se|ag)$/i.test(t));
    
    if (tokens.length > 0) {
      const patternStr = tokens.map((t) => escapeRegExp(t)).join('[\\s\\S]{0,80}?');
      const nameRegex = new RegExp(patternStr, 'gi');
      let m: RegExpExecArray | null;
      while ((m = nameRegex.exec(rawHtml)) !== null) {
        const prefix = rawHtml.substring(0, m.index);
        const lastSlice = prefix.slice(Math.max(0, prefix.length - 350));
        const closeSlice = prefix.slice(Math.max(0, prefix.length - 150));
        let score = 0;
        const documentPositionRatio = m.index / rawHtml.length;
        if (documentPositionRatio > 0.8) score += 20;
        else if (documentPositionRatio > 0.5) score += 5;
        else score -= 10;

        if (/(Ketua|Sekretaris|Direktur|Pimpinan|Kepala|Mengetahui|Menyetujui|Ketum|Sekjen)/i.test(closeSlice)) score += 10;
        if (/(?:<br\s*\/?>\s*){2,}/i.test(closeSlice)) score += 10;
        if (/margin-bottom:\s*\d{2,}px/i.test(closeSlice)) score += 10;
        if (/<div[^>]*style="[^"]*height:\s*\d{2,}px/i.test(closeSlice)) score += 10;

        if (/:\s*(<[^>]+>\s*)*$/.test(closeSlice) || /:\s*$/.test(prefix.trim())) score -= 30;
        if (/:\s*[a-zA-Z.\s<>]*$/.test(closeSlice)) score -= 50;
        if (/Lampiran/i.test(lastSlice)) score -= 30;
        if (/<li/i.test(closeSlice) && !/<\/li>/i.test(closeSlice)) score -= 20;

        console.log(`Cand "${cand}" match at ${m.index} (ratio ${(documentPositionRatio*100).toFixed(2)}%): Score = ${score}`);
        console.log('Context closeSlice:', JSON.stringify(closeSlice));
      }
    }
  }
} catch (err) {
  console.error('CAUGHT ERROR:', err);
}

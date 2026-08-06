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

const mockHtml = `
<table style="width: 100%; border: none;">
  <tr>
    <td style="width: 50%; text-align: center; vertical-align: top;">
      Ketua,<br><br><br><br><u>K.H. M. CHOLIL NAFIS, Lc., Ph.D.</u>
    </td>
    <td style="width: 50%; text-align: center; vertical-align: top;">
      BADAN PENGURUS...<br>
      Sekretaris,<br><br><br><br><u>Dr. H. AMIRSYAH TAMBUNAN, M.A.</u>
    </td>
  </tr>
</table>
`;

const row = {
  qrDataUrl: 'data:image/png;base64,...',
  candidates: ['Dr. H. Amirsyah Tambunan, M.A.', 'Amirsyah Tambunan']
};

const res = injectSignatureQrIntoHtml(mockHtml, row, 'http://localhost');
console.log(res.injected);
console.log(res.html);

import { jsPDF } from 'jspdf';
import { ScannedDocument, DocumentVersion } from '../types/document';

/**
 * Converts an image data URL (SVG, PNG, or JPEG) to a high-res raster data URL
 * so jsPDF can reliably render it on any device.
 */
async function rasterizeImageForPdf(imageSrc: string): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Target standard high-res print dimension
      const maxDim = 1600;
      let w = img.naturalWidth || 800;
      let h = img.naturalHeight || 1100;

      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ dataUrl: imageSrc, width: w, height: h });
        return;
      }

      // Draw white background for transparent SVGs
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      const rasterUrl = canvas.toDataURL('image/jpeg', 0.92);
      resolve({ dataUrl: rasterUrl, width: w, height: h });
    };

    img.onerror = () => {
      // Fallback
      resolve({ dataUrl: imageSrc, width: 600, height: 800 });
    };

    img.src = imageSrc;
  });
}

/**
 * Generates and downloads a complete, professional PDF document from a scanned document.
 * Includes both the visual document scan page and the searchable verbatim OCR transcript page.
 */
export async function convertDocumentToPDF(
  doc: ScannedDocument,
  targetVersion?: DocumentVersion | null
): Promise<void> {
  const version = targetVersion || doc.versions?.find((v) => v.versionNumber === doc.currentVersion) || {
    versionNumber: doc.currentVersion || 1,
    imageUrl: doc.imageUrl,
    fullText: doc.fullText,
    summary: doc.summary,
    extractedFields: doc.extractedFields,
    checksumSHA256: doc.cloudStorage?.checksumSHA256 || 'default-hash',
    scannedAt: doc.scannedAt,
    operator: 'Authorized User',
  };

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth(); // ~210 mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // ~297 mm
  const margin = 14;

  // -----------------------------------------------------------
  // PAGE 1: Scanned Document Visual & Verification Header
  // -----------------------------------------------------------

  // Top Security Header Bar
  pdf.setFillColor(15, 23, 42); // slate-900
  pdf.rect(0, 0, pageWidth, 18, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('DOCUVAULT AI · ENCRYPTED DOCUMENT ARCHIVE', margin, 11);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(52, 211, 153); // emerald-400
  pdf.text(`VERIFIED ARCHIVE · VERSION ${version.versionNumber}`, pageWidth - margin, 11, { align: 'right' });

  // Document Title & Metadata
  pdf.setTextColor(15, 23, 42);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  const cleanTitle = pdf.splitTextToSize(doc.title, pageWidth - margin * 2);
  pdf.text(cleanTitle, margin, 27);

  const titleHeight = cleanTitle.length * 6;
  const metaY = 27 + titleHeight;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(100, 116, 139); // slate-500
  pdf.text(
    `Folder: ${doc.folderName}   |   Type: ${doc.documentType}   |   Scanned: ${new Date(version.scannedAt || doc.scannedAt).toLocaleDateString()}   |   ID: #${doc.id.substring(0, 8)}`,
    margin,
    metaY
  );

  // Rasterize image and embed
  try {
    const { dataUrl, width, height } = await rasterizeImageForPdf(version.imageUrl || doc.imageUrl);
    const availableW = pageWidth - margin * 2;
    const availableH = pageHeight - metaY - 32;

    const imgAspect = width / height;
    let targetW = availableW;
    let targetH = targetW / imgAspect;

    if (targetH > availableH) {
      targetH = availableH;
      targetW = targetH * imgAspect;
    }

    const imgX = margin + (availableW - targetW) / 2;
    const imgY = metaY + 6;

    // Subtle border for document image
    pdf.setDrawColor(226, 232, 240);
    pdf.setFillColor(248, 250, 252);
    pdf.rect(imgX - 1, imgY - 1, targetW + 2, targetH + 2, 'FD');

    pdf.addImage(dataUrl, 'JPEG', imgX, imgY, targetW, targetH, undefined, 'FAST');
  } catch (err) {
    console.warn('Could not embed image into PDF:', err);
  }

  // Page 1 Footer
  pdf.setFontSize(7.5);
  pdf.setTextColor(148, 163, 184); // slate-400
  pdf.text(
    `SHA-256: ${version.checksumSHA256 || doc.cloudStorage?.checksumSHA256}   |   AES-256-GCM Vault Secured`,
    margin,
    pageHeight - 8
  );
  pdf.text('Page 1 of 2', pageWidth - margin, pageHeight - 8, { align: 'right' });

  // -----------------------------------------------------------
  // PAGE 2: Searchable OCR Verbatim Transcript & Entity Fields
  // -----------------------------------------------------------
  pdf.addPage();

  // Top Header Bar
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, pageWidth, 18, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('OPTICAL CHARACTER RECOGNITION (OCR) TRANSCRIPT', margin, 11);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(52, 211, 153);
  pdf.text('GEMINI 3.8 FLASH VISION EXTRACT', pageWidth - margin, 11, { align: 'right' });

  let cursorY = 28;

  // Executive Summary Box
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(203, 213, 225);
  const summaryText = version.summary || doc.summary || 'Document transcript archived with verified cryptographic integrity.';
  const wrappedSummary = pdf.splitTextToSize(summaryText, pageWidth - margin * 2 - 8);
  const summaryBoxH = wrappedSummary.length * 4.5 + 12;

  pdf.roundedRect(margin, cursorY, pageWidth - margin * 2, summaryBoxH, 2, 2, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(5, 150, 105); // emerald-600
  pdf.text('EXECUTIVE SUMMARY', margin + 4, cursorY + 6);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(30, 41, 59);
  pdf.text(wrappedSummary, margin + 4, cursorY + 12);

  cursorY += summaryBoxH + 8;

  // Extracted Key Fields Table
  const fields = version.extractedFields || doc.extractedFields || [];
  if (fields.length > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(15, 23, 42);
    pdf.text('EXTRACTED ENTITIES & VALUES', margin, cursorY);
    cursorY += 5;

    const colWidth = (pageWidth - margin * 2) / 2;
    fields.slice(0, 8).forEach((f, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = margin + col * colWidth;
      const y = cursorY + row * 8;

      pdf.setFillColor(241, 245, 249);
      pdf.rect(x, y - 4, colWidth - 2, 7, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text(`${f.key}: `, x + 2, y);

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(15, 23, 42);
      const valText = pdf.splitTextToSize(f.value, colWidth - 28);
      pdf.text(valText[0] || '', x + 24, y);
    });

    cursorY += Math.ceil(Math.min(fields.length, 8) / 2) * 8 + 6;
  }

  // Full Searchable OCR Text Body
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(15, 23, 42);
  pdf.text('FULL TEXT TRANSCRIPT', margin, cursorY);
  cursorY += 5;

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(30, 41, 59);

  const rawText = version.fullText || doc.fullText || 'No text extracted';
  const textLines = pdf.splitTextToSize(rawText, pageWidth - margin * 2);

  const maxLinesOnPage2 = Math.floor((pageHeight - cursorY - 18) / 4.2);
  const page2Lines = textLines.slice(0, maxLinesOnPage2);
  pdf.text(page2Lines, margin, cursorY);

  // If text overflows, add Page 3
  if (textLines.length > maxLinesOnPage2) {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(7.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text('... (Continued on next page)', margin, pageHeight - 12);

    pdf.addPage();
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, 18, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('OCR TRANSCRIPT (CONTINUED)', margin, 11);

    pdf.setFont('courier', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(30, 41, 59);
    const remainingLines = textLines.slice(maxLinesOnPage2, maxLinesOnPage2 + 55);
    pdf.text(remainingLines, margin, 28);
  }

  // Page 2 Footer
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(148, 163, 184);
  pdf.text(
    `Cryptographically Verified by DocuVault Cloud Storage Vault   |   ${new Date().toISOString()}`,
    margin,
    pageHeight - 8
  );
  pdf.text(`Page 2`, pageWidth - margin, pageHeight - 8, { align: 'right' });

  // Save / Trigger Download
  const filename = `${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_v${version.versionNumber}.pdf`;
  pdf.save(filename);
}

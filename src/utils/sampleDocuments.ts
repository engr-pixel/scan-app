// Sample preset document images and data for instant 1-click testing
export interface PresetDocument {
  id: string;
  name: string;
  category: string;
  description: string;
  mimeType: string;
  imageBase64: string; // Data URL
  defaultTags: string[];
}

// Generate realistic SVG-based data URL for high-contrast scannable documents
function createSampleSvgDataUrl(title: string, subtitle: string, lines: string[], stampText = 'OFFICIAL COPY'): string {
  const lineSvg = lines
    .map((l, i) => {
      const y = 160 + i * 26;
      const isHeader = l.startsWith('##') || l.startsWith('ITEM') || l.startsWith('TOTAL');
      const fontSize = isHeader ? '14' : '12';
      const fontWeight = isHeader ? 'bold' : 'normal';
      const color = isHeader ? '#0f172a' : '#334155';
      const clean = l.replace(/^##\s*/, '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<text x="60" y="${y}" font-family="Courier New, monospace" font-size="${fontSize}" font-weight="${fontWeight}" fill="${color}">${clean}</text>`;
    })
    .join('\n');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 650 850" width="650" height="850">
    <!-- Paper texture & drop shadow -->
    <rect x="25" y="25" width="600" height="800" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
    <rect x="27" y="27" width="596" height="796" rx="3" fill="#f8fafc" opacity="0.4"/>
    
    <!-- Letterhead -->
    <rect x="60" y="55" width="530" height="4" fill="#0f172a"/>
    <text x="60" y="90" font-family="Helvetica, Arial, sans-serif" font-size="20" font-weight="bold" fill="#0f172a">${title.replace(/</g, '&lt;')}</text>
    <text x="60" y="112" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="600" fill="#059669" letter-spacing="1">${subtitle.toUpperCase()}</text>
    <text x="590" y="90" text-anchor="end" font-family="Courier New, monospace" font-size="11" fill="#64748b">DATE: 2026-10-12</text>
    <text x="590" y="110" text-anchor="end" font-family="Courier New, monospace" font-size="10" fill="#94a3b8">REF: #SCAN-${Math.floor(100000 + Math.random() * 900000)}</text>
    <line x1="60" y1="128" x2="590" y2="128" stroke="#cbd5e1" stroke-width="1.5"/>

    <!-- Document Lines -->
    ${lineSvg}

    <!-- Official Stamp -->
    <g transform="translate(420, 680) rotate(-10)">
      <rect x="0" y="0" width="150" height="52" rx="4" fill="none" stroke="#dc2626" stroke-width="2" stroke-dasharray="6,2" opacity="0.85"/>
      <text x="75" y="22" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="bold" fill="#dc2626" letter-spacing="1">${stampText}</text>
      <text x="75" y="38" text-anchor="middle" font-family="Courier New, monospace" font-size="9" font-weight="bold" fill="#dc2626">VERIFIED SCAN · 2026</text>
    </g>

    <!-- Bottom security bar code -->
    <line x1="60" y1="765" x2="590" y2="765" stroke="#e2e8f0" stroke-width="1"/>
    <text x="60" y="785" font-family="monospace" font-size="9" fill="#94a3b8">CLOUD ENCRYPTED · AES-256-GCM · DOCUVAULT ARCHIVE SECURE SYSTEM</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_PRESET_DOCUMENTS: PresetDocument[] = [
  {
    id: 'sample-invoice',
    name: 'Enterprise Cloud Billing Invoice',
    category: 'Finance & Tax',
    description: 'Detailed enterprise software invoice with line items, tax, and PO',
    mimeType: 'image/svg+xml',
    defaultTags: ['Invoice', 'Software', 'Q4 2026', 'Accounts Payable'],
    imageBase64: createSampleSvgDataUrl(
      'VERTEX CLOUD INFRASTRUCTURE INC.',
      'TAX INVOICE & BILLING SUMMARY',
      [
        '## INVOICE NUMBER: INV-2026-9921  |  DATE: OCTOBER 12, 2026',
        'Customer: Horizon Technologies Ltd.  |  Account ID: #HT-882190',
        'Payment Terms: Net 30 Days  |  Due Date: November 11, 2026',
        '------------------------------------------------------------',
        'ITEM 1: AI Model Compute Acceleration (250 GPU Hrs) .. $ 1,875.00',
        'ITEM 2: Dedicated Vector Database Cluster (50M vectors) $   640.00',
        'ITEM 3: Enterprise Cloud Storage Backup (8 Terabytes) . $   320.00',
        'ITEM 4: SLA Priority Support & 24/7 Operations Coverage  $   500.00',
        '------------------------------------------------------------',
        'SUBTOTAL: $3,335.00  |  SALES TAX (8.5%): $283.48',
        '## TOTAL DUE: $3,618.48 USD',
        'Wire Remittance: Depository Bank NY (Routing: 021000089)',
        'Signed: Kimberly Vance, Corporate Controller'
      ],
      'APPROVED FOR PAYMENT'
    )
  },
  {
    id: 'sample-receipt',
    name: 'Corporate Catering & Dinner Receipt',
    category: 'Receipts & Expenses',
    description: 'Itemized restaurant receipt with gratuity and card authorization',
    mimeType: 'image/svg+xml',
    defaultTags: ['Receipt', 'Dining', 'Client Entertainment', 'Expense Report'],
    imageBase64: createSampleSvgDataUrl(
      'LUMEN BISTRO & FINE DINING',
      'CUSTOMER TRANSACTION RECEIPT',
      [
        '## TABLE 08  |  SERVER: JULIAN  |  DATE: 10/11/2026 19:42',
        'Transaction ID: TXN-5582910  |  Register: POS-02',
        'Card: VISA BUSINESS ending in 8831 (Contactless)',
        '------------------------------------------------------------',
        '1x Artisanal Burrata & Wild Fig Salad ....... $ 19.50',
        '2x Pan-Seared Chilean Sea Bass .............. $ 96.00',
        '1x Dry-Aged Prime Ribeye 16oz ............... $ 72.00',
        '1x Napa Valley Cabernet Sauvignon ........... $ 110.00',
        '2x Espresso Double Shot ..................... $ 11.00',
        '1x Valrhona Chocolate Fondant ............... $ 16.00',
        '------------------------------------------------------------',
        'FOOD & BEVERAGE SUBTOTAL: $324.50',
        'STATE SALES TAX (9.25%): $30.02',
        'GRATUITY (20% AUTO-GRAT): $64.90',
        '## TOTAL AMOUNT CHARGED: $419.42 USD',
        'AUTH CODE: 094812  |  APPROVED'
      ],
      'AUDIT VERIFIED'
    )
  },
  {
    id: 'sample-contract',
    name: 'Mutual Non-Disclosure Agreement (NDA)',
    category: 'Legal & Contracts',
    description: 'Confidentiality agreement with IP terms, scope, and signatures',
    mimeType: 'image/svg+xml',
    defaultTags: ['Contract', 'NDA', 'Confidential', 'Legal'],
    imageBase64: createSampleSvgDataUrl(
      'MUTUAL CONFIDENTIALITY & NDA',
      'LEGAL COVENANT & NON-DISCLOSURE',
      [
        '## DATED: OCTOBER 08, 2026',
        'Party A: DocuVault Systems Inc. (Delaware Corporation)',
        'Party B: Apex Robotics LLC (California Corporation)',
        '------------------------------------------------------------',
        '1. PURPOSE: Evaluation of strategic cloud AI integration.',
        '2. CONFIDENTIAL INFORMATION: All proprietary code, algorithms,',
        '   financial statements, customer lists, and patent filings.',
        '3. TERM: Two (2) consecutive calendar years from Effective Date.',
        '4. EXCLUSIONS: Information already in the public domain.',
        '5. GOVERNING LAW: The laws of the State of California.',
        '------------------------------------------------------------',
        'IN WITNESS WHEREOF, the parties have executed this Agreement.',
        'Signed Party A: Elena Rostova, VP Legal Counsel',
        'Signed Party B: David Kim, Chief Executive Officer'
      ],
      'EXECUTED & BINDING'
    )
  },
  {
    id: 'sample-medical',
    name: 'Clinical Diagnostics Lab Blood Panel',
    category: 'Medical & Health',
    description: 'Complete blood count and metabolic chemistry report',
    mimeType: 'image/svg+xml',
    defaultTags: ['Health', 'Lab Report', 'Bloodwork', 'Confidential'],
    imageBase64: createSampleSvgDataUrl(
      'BIOPATH LABORATORY DIAGNOSTICS',
      'CLINICAL PATHOLOGY LABORATORY REPORT',
      [
        '## PATIENT: JORDAN HAYES  |  DOB: 05/18/1988  |  AGE: 38',
        'Ordering Provider: Dr. Michael Chen MD  |  Specimen: Serum',
        'Collection Date: 10/10/2026 08:15 AM  |  Lab Ref: #BP-99410',
        '------------------------------------------------------------',
        'Glucose Fasting: ........... 94 mg/dL   [Range: 70 - 99] NORMAL',
        'Hemoglobin A1c: ............. 5.2 %      [Range: <5.7%]   OPTIMAL',
        'Total Cholesterol: ......... 174 mg/dL  [Range: <200]    OPTIMAL',
        'HDL Good Cholesterol: ....... 64 mg/dL   [Range: >45]     EXCELLENT',
        'Triglycerides: .............. 82 mg/dL   [Range: <150]    NORMAL',
        'Vitamin D (25-Hydroxy): ..... 48 ng/mL   [Range: 30 - 100] NORMAL',
        'TSH (Thyroid): .............. 1.85 uIU/mL [Range: 0.4 - 4.0] NORMAL',
        '------------------------------------------------------------',
        '## SUMMARY: All clinical markers reflect optimal metabolic health.',
        'Physician Review Signed: Dr. Michael Chen, MD (Cardiology)'
      ],
      'HIPAA CONFIDENTIAL'
    )
  }
];

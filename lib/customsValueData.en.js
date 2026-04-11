// ============================================================
// CUSTOMS VALUE — Complete data (UCC / Reg. 2015/2447) — EN
// ============================================================

// ── Block 1: 6 valuation methods ───────────────────────────

export const VALUATION_METHODS_EN = [
  {
    number: 1,
    title: 'Transaction value',
    article: 'Art. 70 UCC',
    frequency: 'habitual',
    frequencyLabel: 'Standard use (~90%)',
    description:
      'Price actually paid or payable when goods are sold for export to the EU customs territory, adjusted in accordance with Article 71.',
    conditions: [
      'No restrictions on the buyer\'s use or disposal of the goods',
      'Sale is not subject to conditions whose value cannot be determined',
      'No part of the resale proceeds reverts to the seller without being adjustable',
      'No relationship between buyer and seller that influences the price',
    ],
    keyChange:
      'Key UCC change: the last sale before introduction into the EU is used (not the first as before). Criterion confirmed by the CJEU and the Spanish Supreme Court.',
  },
  {
    number: 2,
    title: 'Identical goods',
    article: 'Art. 74.2.a) UCC',
    frequency: 'secundario',
    frequencyLabel: 'Subsidiary to Method 1',
    description:
      'Transaction price accepted by customs for identical goods, sold for export to the EU and exported at the same or approximately the same time.',
    conditions: [
      'Identical: alike in all respects (quality, physical characteristics, reputation, brand)',
      'Same commercial level and substantially equal quantities',
      'If quantities are not equal, proportional adjustment is made',
    ],
    keyChange: null,
  },
  {
    number: 3,
    title: 'Similar goods',
    article: 'Art. 74.2.b) UCC',
    frequency: 'secundario',
    frequencyLabel: 'Subsidiary to Methods 1 and 2',
    description:
      'Same as Method 2 but with goods that are not identical but similar: same function, similar characteristics and commercially interchangeable.',
    conditions: [
      'Similar: not identical but with equivalent function and produced in the same country',
      'Same quality, reputation and trade mark',
      'Exported at the same or approximately the same time',
    ],
    keyChange: null,
  },
  {
    number: 4,
    title: 'Deductive method',
    article: 'Art. 74.2.c) UCC',
    frequency: 'excepcional',
    frequencyLabel: 'Exceptional use',
    description:
      'Based on the EU selling price of imported goods (or identical/similar goods), deducting profits, general expenses, EU transport and insurance, and import duties.',
    conditions: [
      'Used when Methods 1, 2 and 3 do not apply',
      'The importer may request to reverse the order with Method 5',
      'Based on the most frequent unit price in sales to unrelated parties',
    ],
    keyChange: null,
  },
  {
    number: 5,
    title: 'Computed value',
    article: 'Art. 74.2.d) UCC',
    frequency: 'excepcional',
    frequencyLabel: 'Very rare in practice',
    description:
      'Value is reconstructed by adding the cost of materials and manufacturing, the exporter\'s usual profit, and transport and insurance to the EU border.',
    conditions: [
      'Requires access to the foreign manufacturer\'s cost data',
      'Rarely used in practice due to the difficulty of obtaining such information',
      'The importer may request to reverse the order with Method 4',
    ],
    keyChange: null,
  },
  {
    number: 6,
    title: 'Fall-back method',
    article: 'Art. 74.3 UCC',
    frequency: 'excepcional',
    frequencyLabel: 'Only when all else fails',
    description:
      'Reasonable criteria based on available data in the EU customs territory, compatible with the general principles of the GATT Valuation Agreement.',
    conditions: [
      'Applicable when no other method works (donations, samples, consignment goods without invoice)',
      'Cannot be based on export prices to third countries or on minimum values',
      'Cannot be based on systems that provide for acceptance of the higher of two possible values',
    ],
    keyChange: null,
  },
]

// ── Block 4: Numerical examples (3 Incoterms) ─────────────

export const NUMERICAL_EXAMPLES_EN = [
  {
    id: 'fob',
    title: 'Maritime FOB (the classic)',
    product: 'Industrial machinery',
    hs: '8479.89',
    incoterm: 'FOB Los Angeles',
    dutyRate: '3.7%',
    vatRate: '21%',
    cartaPorte: 'to Madrid',
    steps: {
      customsValue: {
        label: 'Customs value',
        items: [
          { concept: 'FOB price', amount: 45000 },
          { concept: 'Maritime freight LA→Barcelona', amount: 4500, sign: '+' },
          { concept: 'International insurance', amount: 500, sign: '+' },
        ],
        total: 50000,
      },
      duty: { base: 50000, rate: 3.7, amount: 1850 },
      vatBase: {
        label: 'VAT base',
        items: [
          { concept: 'Customs value', amount: 50000 },
          { concept: 'Tariffs', amount: 1850, sign: '+' },
          { concept: 'Transport Barcelona→Madrid', amount: 800, sign: '+' },
          { concept: 'Inland insurance', amount: 50, sign: '+' },
        ],
        total: 52700,
      },
      vat: { base: 52700, rate: 21, amount: 11067 },
      totalTax: 12917,
    },
    duaRefs: [
      'D.E. 14 01 (box 42): 45,000 EUR',
      'D.E. 14 07 (box 45): +5,000 EUR',
      'D.E. 14 06 (box 46): 50,000 EUR',
    ],
  },
  {
    id: 'cif',
    title: 'CIF (no adjustments)',
    product: 'Electronic components',
    hs: '8542.31',
    incoterm: 'CIF Valencia',
    dutyRate: '0%',
    vatRate: '21%',
    cartaPorte: 'to Valencia (= EU border)',
    steps: {
      customsValue: {
        label: 'Customs value',
        items: [
          { concept: 'CIF price', amount: 28000 },
        ],
        note: 'No adjustments — CIF = customs value',
        total: 28000,
      },
      duty: { base: 28000, rate: 0, amount: 0 },
      vatBase: {
        label: 'VAT base',
        items: [
          { concept: 'Customs value', amount: 28000 },
          { concept: 'Tariffs', amount: 0, sign: '+' },
        ],
        note: 'No inland transport — destination = EU border',
        total: 28000,
      },
      vat: { base: 28000, rate: 21, amount: 5880 },
      totalTax: 5880,
    },
    duaRefs: [
      'D.E. 14 01 (box 42): 28,000 EUR',
      'D.E. 14 07 (box 45): 0 EUR',
      'D.E. 14 06 (box 46): 28,000 EUR',
    ],
  },
  {
    id: 'ddp',
    title: 'DDP (the complex one)',
    product: 'Textiles',
    hs: '6204.62',
    incoterm: 'DDP Madrid',
    dutyRate: '12%',
    vatRate: '21%',
    cartaPorte: 'to Madrid',
    priceBreakdown: [
      { concept: 'Goods', amount: 25000 },
      { concept: 'Freight Shanghai→Barcelona', amount: 3000 },
      { concept: 'Insurance', amount: 200 },
      { concept: 'Transport Barcelona→Madrid', amount: 600 },
      { concept: 'Tariffs (12%)', amount: 3384 },
      { concept: 'Clearance + agent', amount: 400 },
    ],
    totalInvoice: 35000,
    steps: {
      customsValue: {
        label: 'Customs value',
        items: [
          { concept: 'DDP price', amount: 35000 },
          { concept: 'Tariffs included', amount: -3384, sign: '−' },
          { concept: 'Transport Barcelona→Madrid', amount: -600, sign: '−' },
          { concept: 'Clearance/agent', amount: -400, sign: '−' },
        ],
        note: '= goods 25,000 + freight 3,000 + insurance 200',
        total: 28200,
      },
      duty: { base: 28200, rate: 12, amount: 3384 },
      vatBase: {
        label: 'VAT base',
        items: [
          { concept: 'Customs value', amount: 28200 },
          { concept: 'Tariffs', amount: 3384, sign: '+' },
          { concept: 'Transport Barcelona→Madrid', amount: 600, sign: '+' },
        ],
        total: 32184,
      },
      vat: { base: 32184, rate: 21, amount: 6759 },
      totalTax: 10143,
    },
    wrongDeclaration: {
      wrongDuty: { base: 35000, rate: 12, amount: 4200 },
      wrongVatBase: 39800,
      wrongVat: 8358,
      overpayDuty: 816,
      overpayVat: 1599,
      overpayTotal: 2415,
    },
    duaRefs: [
      'D.E. 14 01 (box 42): 35,000 EUR',
      'D.E. 14 07 (box 45): −6,800 EUR',
      'D.E. 14 06 (box 46): 28,200 EUR',
    ],
  },
]

// ── Block 5: DV1 ───────────────────────────────────────────

export const DV1_INFO_EN = {
  definition: 'Statement of Value — mandatory supplementary form for imports with value exceeding EUR 20,000 per shipment.',
  threshold: 'EUR 20,000',
  exceptions: [
    'Non-commercial transactions',
    'Continuous exchanges between the same parties with customs-authorised dispensation',
  ],
  sections: [
    {
      label: 'Boxes 1-15',
      title: 'Identification',
      content: 'Party data, Incoterm, invoice, relationship and price conditions, existence of royalties/licence fees.',
    },
    {
      label: 'Section B (box 18)',
      title: 'Elements to ADD',
      content: 'Selling commissions, packaging, assists, royalties, transport and insurance to the EU border.',
      note: 'Feeds the positive adjustment in D.E. 14 07 (box 45).',
    },
    {
      label: 'Section C (box 23)',
      title: 'Elements to DEDUCT',
      content: 'Post-border transport, installation/assembly, import duties, financing interest.',
      note: 'Feeds the negative adjustment in D.E. 14 07 (box 45).',
    },
  ],
  formula: 'D.E. 14 01 (invoice price) ± D.E. 14 07 (adjustments) = Customs value ≈ D.E. 14 06 (statistical value)',
  formulaDUA: 'Box 42 ± Box 45 = Customs value ≈ Box 46',
}

export const EXTENDED_DUA_H1_FIELDS_EN = [
  { concept: 'Invoice price', dua: 'Box 42', h1: 'D.E. 14 01', group: 'Group 14', description: 'Amount as stated in the commercial invoice, without adjustments' },
  { concept: 'Additions and deductions', dua: 'Box 45', h1: 'D.E. 14 07', group: 'Group 14', description: '+/− to arrive at customs value. Positive = add, negative = subtract' },
  { concept: 'Statistical value', dua: 'Box 46', h1: 'D.E. 14 06', group: 'Group 14', description: 'CIF value in EUR at the Spanish border' },
  { concept: 'Delivery terms', dua: 'Box 20', h1: 'D.E. 14 11', group: 'Group 14', description: 'Incoterm code + place (e.g. "CIF Valencia")' },
  { concept: 'Valuation method', dua: 'Box 43', h1: 'D.E. 14 16', group: 'Group 14', description: 'Code 1-6 according to the UCC method applied' },
  { concept: 'Valuation indicators', dua: 'Box 43', h1: 'D.E. 14 02', group: 'Group 14', description: 'Relationship between parties, price restrictions' },
  { concept: 'Tax assessment', dua: 'Box 47', h1: 'D.E. 14 03', group: 'Group 14', description: 'A00 = tariff, B00 = VAT, C00 = other taxes' },
  { concept: 'Tax base', dua: 'Box 47', h1: 'D.E. 14 04', group: 'Group 14', description: 'Calculation base for each tax' },
  { concept: 'Exchange rate', dua: 'Box 23', h1: 'D.E. 14 05', group: 'Group 14', description: 'ECB rate in force at date of acceptance' },
  { concept: 'Country of origin', dua: 'Box 34a', h1: 'D.E. 16 06', group: 'Group 16', description: 'Non-preferential origin (erga omnes)' },
  { concept: 'Preferential origin country', dua: 'Box 34a', h1: 'D.E. 16 03', group: 'Group 16', description: 'Origin with applicable trade agreement' },
  { concept: 'Net mass', dua: 'Box 38', h1: 'D.E. 18 01', group: 'Group 18', description: 'Weight in kg (base for specific duties)' },
  { concept: 'Commodity code', dua: 'Box 33', h1: 'D.E. 18 09', group: 'Group 18', description: 'Full 10-digit TARIC code' },
  { concept: 'MRN', dua: '—', h1: 'D.E. 11 08', group: 'Group 11', description: 'Movement Reference Number of the declaration' },
  { concept: 'Requested procedure', dua: 'Box 37.1', h1: 'D.E. 11 09', group: 'Group 11', description: '4000 = free circulation, 4200 = FC + deferred VAT (art. 167 VAT Law)' },
  { concept: 'Supporting document', dua: 'Box 44', h1: 'D.E. 12 03', group: 'Group 12', description: 'EUR.1, ATR, invoice declaration, health certificates, CBAM' },
]

// ── Block 3: Adjustments art. 71/72 UCC (extended) ─────────

export const ENHANCED_CAU_ADJUSTMENTS_EN = {
  alwaysAdd: [
    {
      concept: 'Selling commissions and brokerage',
      article: 'Art. 71.1.a) UCC',
      description: 'Always added when paid by the buyer and not included in the price.',
      warning: 'DO NOT confuse with buying commissions (those of the agent representing the importer), which are NOT added (Art. 72).',
      example: null,
    },
    {
      concept: 'Containers and packaging',
      article: 'Art. 71.1.a) UCC',
      description: 'Both the cost of containers that form a whole with the goods and the labour and materials for packaging.',
      warning: null,
      example: null,
    },
    {
      concept: 'Buyer\'s contributions (assists)',
      article: 'Art. 71.1.b) UCC',
      description: 'Materials, components, tools, dies, moulds and engineering/design work carried out outside the EU, supplied by the buyer to the manufacturer free of charge or at reduced price for production.',
      warning: null,
      example: 'You send moulds from Spain to your supplier in China to manufacture parts. The value of those moulds is added to the customs value of the imported parts, prorated across the units produced.',
    },
    {
      concept: 'Royalties and licence fees',
      article: 'Art. 71.1.c) UCC',
      description: 'Included if they are a condition of sale of the imported goods. Under the UCC, it is sufficient that the goods cannot be purchased without payment of the royalty.',
      warning: 'Highly contentious area. Criterion broadened by CJEU case law. In case of doubt, consult a specialist in customs valuation.',
      example: 'You import branded clothing and pay a royalty to the licensor for using the brand. If you cannot buy those garments without the licence agreement, the royalty is added to the customs value.',
    },
    {
      concept: 'Proceeds of resale',
      article: 'Art. 71.1.d) UCC',
      description: 'Any part of the proceeds of a subsequent resale that accrues directly or indirectly to the seller.',
      warning: null,
      example: null,
    },
    {
      concept: 'Transport and insurance to the EU border',
      article: 'Art. 71.1.e) UCC',
      description: 'Transport, loading, handling and insurance to the place of introduction into the EU customs territory. Already covered in detail in the Incoterm adjustments section.',
      warning: null,
      example: null,
    },
  ],
  neverInclude: [
    {
      concept: 'Transport after entry into the EU',
      article: 'Art. 72.a) UCC',
      description: 'Transport from the point of entry into the EU to the final destination is not part of customs value (although it may be included in the VAT base).',
    },
    {
      concept: 'Construction, installation, assembly or maintenance',
      article: 'Art. 72.b) UCC',
      description: 'Work carried out after importation of the goods into EU territory.',
    },
    {
      concept: 'Financing interest',
      article: 'Art. 72.c) UCC',
      description: 'Provided they are in writing, the rate does not exceed the normal market rate and the buyer can demonstrate it is genuine financing.',
    },
    {
      concept: 'Reproduction rights in the EU',
      article: 'Art. 72.d) UCC',
      description: 'Payments for the right to reproduce imported goods in EU territory.',
    },
    {
      concept: 'Buying commissions',
      article: 'Art. 72.e) UCC',
      description: 'Those remunerating the agent representing the importer (buying agent). Not to be confused with selling commissions which ARE added.',
    },
    {
      concept: 'Import duties and other EU charges',
      article: 'Art. 72.f) UCC',
      description: 'Tariffs, VAT, excise duties and other charges payable in the EU on importation or sale of the goods.',
    },
    {
      concept: 'Distribution/resale payments',
      article: 'Art. 72 UCC',
      description: 'Payments for the right to distribute or resell imported goods, when not a condition of sale for export.',
    },
  ],
}

// ── Block 6: Problematic cases ─────────────────────────────

export const PROBLEMATIC_CASES_EN = [
  {
    id: 'ddp-sin-desglose',
    title: 'DDP invoices without breakdown',
    icon: '🚨',
    severity: 'critical',
    problem: 'The supplier issues a DDP invoice for EUR 140,000 without specifying what portion is goods, freight, tariffs or VAT. If you declare the total as customs value, double taxation occurs: you pay duties on the duties already included in the price.',
    why: 'Many Asian suppliers issue DDP invoices with a single global price without breakdown. The importer assumes that is the customs value and declares it in full.',
    solution: 'Require the supplier to provide a detailed breakdown on the invoice OR document each cost with separate invoices (carrier, agent, tax assessment). If the supplier refuses, estimate the components using market data and document it.',
    reference: 'Art. 72 UCC (elements excluded from customs value)',
  },
  {
    id: 'rechazo-valor',
    title: 'Rejection of declared value by customs',
    icon: '⚠️',
    severity: 'warning',
    problem: 'Customs has "founded doubts" about the declared value: price very low compared to reference values, missing documentation or inconsistencies between documents.',
    why: 'Customs maintains databases of reference values by product and origin. When a declared value deviates significantly, the doubt procedure is triggered.',
    solution: 'Customs must resort to the secondary methods of Art. 74 UCC, in mandatory sequential order. The importer has the right to request a written explanation of the method used and to appeal the assessment if they disagree.',
    reference: 'Art. 140 Implementing Reg. 2015/2447',
  },
  {
    id: 'vinculacion',
    title: 'Related parties (companies in the same group)',
    icon: '🏢',
    severity: 'warning',
    problem: 'You import from a group company and customs questions whether the transfer price is influenced by the relationship.',
    why: 'There is a relationship when a person owns/controls 5% or more of the shares of the other, they share management, there is an employer-employee relationship or they are members of the same family.',
    solution: 'Demonstrate that the relationship has NOT influenced the price through: examination of the circumstances of the sale, or comparison with test values (identical/similar goods to unrelated parties). Transfer pricing studies are complementary but not determinative on their own for customs purposes.',
    reference: 'Art. 70.3.d) UCC; Art. 134 Reg. 2015/2447',
  },
  {
    id: 'royalties',
    title: 'Royalties/licence fees — include or not?',
    icon: '©️',
    severity: 'warning',
    problem: 'You pay royalties to a third party (licensor) different from the manufacturer. The question is whether they should be added to customs value.',
    why: 'The UCC criterion is broader than before: they are included if they are a "condition of sale". It is sufficient that the goods cannot be purchased without payment of the royalty, even if payment is to a third party.',
    solution: 'If not quantifiable at the time of clearance: simplified declaration with provisional value + supplementary declaration afterwards (Art. 73 UCC). Deadline: 120 days, extendable up to 2 years.',
    reference: 'Art. 71.1.c) UCC; Art. 136 Reg. 2015/2447',
  },
  {
    id: 'incoterm-inconsistente',
    title: 'Declared Incoterm inconsistent with documents',
    icon: '📄',
    severity: 'info',
    problem: 'The invoice says "EXW" but the bill of lading (B/L) shows the seller paid the freight. Or the invoice says "FOB" but the seller arranged and paid for the maritime transport.',
    why: 'It is common for invoices to mention a "customary" Incoterm without reflecting the actual conditions of the transaction.',
    solution: 'Objective documentation (B/L, CMR, freight invoices) prevails over the mere mention of an Incoterm on the invoice. Always verify consistency between commercial invoice, transport documents, D.E. 14 11 and D.E. 14 01.',
    reference: 'Principle of economic reality in customs valuation',
  },
  {
    id: 'thc-destino',
    title: 'Destination THC — include or not?',
    icon: '⚓',
    severity: 'info',
    problem: 'Destination Terminal Handling Charges (THC): are they part of customs value or not?',
    why: 'Confusion arises because THC may be included in the freight (on the B/L) or invoiced separately by the shipping line or terminal.',
    solution: 'THC that form part of the contractual international freight (included in the B/L) ARE included in customs value (Art. 71.1.e UCC). Purely post-arrival terminal charges (storage, post-clearance handling) may be excluded from customs value, although they could be included in the VAT base as ancillary costs up to the first destination.',
    reference: 'Art. 71.1.e) UCC; Binding rulings DGT',
  },
]

// ── General notes ──────────────────────────────────────────

export const GENERAL_NOTES_EN = {
  insurance:
    'In the EU, only insurance actually taken out and paid for is included in customs value. No fictitious insurance is imputed. If your Incoterm does not include insurance and you have not taken out your own, nothing is added for insurance.',
  airFreight:
    'For goods arriving by air, the total freight cost is not used but a percentage according to Annex 23-01 of Implementing Regulation 2015/2447, which depends on the airport of origin and destination.',
  firstDestination:
    'The "first place of destination" is that shown on the consignment note or other transport document. If there is no indication, it is the place where the first break-bulk of the goods occurs within the EU. It determines how much inland transport is added to the VAT base.',
}

// ── Comparative table: tariff base vs VAT base ─────────────

export const DUTY_VS_VAT_COMPARISON_EN = {
  explanation:
    'The tariff base (A00) and the import VAT base (B00) are two DIFFERENT amounts. Inland transport, tariffs and other charges are added to the VAT base but NOT to customs value.',
  dutyBasis: {
    name: 'Tariff base (A00)',
    formula: 'Customs value (CIF at EU border)',
    legalBasis: 'Arts. 70-72 Regulation (EU) 952/2013 (UCC)',
    declaration: 'D.E. 14 03 type A00 (former box 47 A00)',
  },
  vatBasis: {
    name: 'Import VAT base (B00)',
    formula: 'Customs value + tariffs + excise duties + ancillary costs to first inland destination',
    legalBasis: 'Art. 83.1 Law 37/1992 on VAT + Arts. 85-86 Directive 2006/112/EC',
    declaration: 'D.E. 14 03 type B00 (former box 47 B00)',
  },
  comparison: [
    { concept: 'Price + freight + insurance to EU border', inDutyBase: true, inVatBase: true },
    { concept: 'Tariffs', inDutyBase: false, inVatBase: true },
    { concept: 'Anti-dumping / countervailing duties', inDutyBase: false, inVatBase: true },
    { concept: 'Excise duties', inDutyBase: false, inVatBase: true },
    { concept: 'Transport EU border → first inland destination', inDutyBase: false, inVatBase: true },
    { concept: 'Insurance for inland leg to first destination', inDutyBase: false, inVatBase: true },
    { concept: 'Unloading at EU port/airport', inDutyBase: false, inVatBase: true },
    { concept: 'Transport beyond first destination', inDutyBase: false, inVatBase: false },
    { concept: 'Customs broker fees', inDutyBase: false, inVatBase: false },
    { concept: 'Post-destination storage', inDutyBase: false, inVatBase: false },
  ],
}

// ── Sections for mini-TOC ──────────────────────────────────

export const PAGE_SECTIONS_EN = [
  { id: 'metodos', label: 'Valuation methods', icon: '📐' },
  { id: 'ajustes-incoterm', label: 'Incoterm adjustments', icon: '🔄' },
  { id: 'ajustes-obligatorios', label: 'Mandatory adjustments', icon: '📋' },
  { id: 'base-arancel-iva', label: 'Tariff vs VAT', icon: '⚖️' },
  { id: 'dv1-casillas', label: 'DV1 and H1 fields', icon: '📝' },
  { id: 'casos-problematicos', label: 'Problematic cases', icon: '⚠️' },
]

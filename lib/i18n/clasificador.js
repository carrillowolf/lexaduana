// ── Clasificador (AI Classifier) page translations ─────────

export const clasificadorDict = {
  es: {
    hero: {
      badge: 'BETA',
      powered: 'Powered by Claude 4.5',
      title: '🤖 Clasificador Inteligente',
      subtitle: 'Describe tu producto en lenguaje natural y obtén la clasificación TARIC',
      desc: 'De descripción a código HS en segundos • Validado contra base EUR-Lex',
    },

    disclaimer: {
      title: '⚠️ Aviso Legal',
      text: 'Esta herramienta proporciona <strong>información orientativa</strong> basada en datos públicos de EUR-Lex. No constituye asesoramiento legal ni aduanero vinculante. Para clasificaciones definitivas, consulte con un agente de aduanas colegiado o la AEAT.',
    },

    form: {
      title: 'Describe tu producto',
      subtitle: 'Sé lo más específico posible: material, función, uso...',
      descriptionLabel: 'Descripción del producto *',
      descriptionPlaceholder: 'Ej: Tablets con teclado integrado QWERTY desmontable, pantalla táctil de 10 pulgadas, procesador Intel, para uso industrial en almacenes',
      charCount: 'caracteres (mínimo 10)',
      countryLabel: 'País de origen (opcional)',
      countryPlaceholder: 'Seleccionar país...',
      countryHelp: 'Ayuda a determinar aranceles aplicables',
      cifLabel: 'Valor CIF en € (opcional)',
      cifHelp: 'Para cálculo directo posterior',
      classifying: 'Clasificando con IA...',
      classify: '🤖 Clasificar con IA',
    },

    errors: {
      minLength: 'La descripción debe tener al menos 10 caracteres',
      apiError: 'Error al clasificar',
    },

    confidence: {
      high: 'Alta confianza',
      medium: 'Confianza media',
      low: 'Baja confianza',
    },

    results: {
      title: 'Clasificación Sugerida',
      codeLabel: 'Código TARIC sugerido:',
      verified: 'Verificado en TARIC',
      verifyManually: 'Verificar manualmente',
      dutyRate: 'Arancel ERGA OMNES:',
      reasoning: 'Razonamiento de la IA',
      keyFactors: 'Factores clave de clasificación:',
      warnings: 'Advertencias',
      recommendedOrigins: 'Países de origen recomendados',
      recommendedOriginsHelp: 'Orígenes que podrían ofrecer ventajas arancelarias para este producto',
      additionalInfo: 'Recomendaciones adicionales',
      calculate: '💰 Calcular aranceles con este código',
    },

    alternatives: {
      title: 'Códigos Alternativos',
      subtitle: 'Otras clasificaciones posibles según contexto',
      dutyRate: 'Arancel:',
      inTaric: 'En TARIC',
      calculateWith: 'Calcular con este código →',
    },

    metadata: {
      classifiedBy: 'Clasificación realizada por',
      dataSource: 'Datos basados en EUR-Lex actualizado Oct 2025',
    },
  },

  en: {
    hero: {
      badge: 'BETA',
      powered: 'Powered by Claude 4.5',
      title: '🤖 AI Classifier',
      subtitle: 'Describe your product in natural language and get the TARIC classification',
      desc: 'From description to HS code in seconds • Validated against EUR-Lex database',
    },

    disclaimer: {
      title: '⚠️ Legal Notice',
      text: 'This tool provides <strong>indicative information</strong> based on public EUR-Lex data. It does not constitute binding legal or customs advice. For definitive classifications, consult a licensed customs broker or the relevant authority.',
    },

    form: {
      title: 'Describe your product',
      subtitle: 'Be as specific as possible: material, function, use...',
      descriptionLabel: 'Product description *',
      descriptionPlaceholder: 'E.g.: Tablets with detachable QWERTY keyboard, 10-inch touchscreen, Intel processor, for industrial warehouse use',
      charCount: 'characters (minimum 10)',
      countryLabel: 'Country of origin (optional)',
      countryPlaceholder: 'Select country...',
      countryHelp: 'Helps determine applicable tariffs',
      cifLabel: 'CIF value in € (optional)',
      cifHelp: 'For subsequent direct calculation',
      classifying: 'Classifying with AI...',
      classify: '🤖 Classify with AI',
    },

    errors: {
      minLength: 'Description must be at least 10 characters',
      apiError: 'Classification error',
    },

    confidence: {
      high: 'High confidence',
      medium: 'Medium confidence',
      low: 'Low confidence',
    },

    results: {
      title: 'Suggested Classification',
      codeLabel: 'Suggested TARIC code:',
      verified: 'Verified in TARIC',
      verifyManually: 'Verify manually',
      dutyRate: 'ERGA OMNES duty:',
      reasoning: 'AI Reasoning',
      keyFactors: 'Key classification factors:',
      warnings: 'Warnings',
      recommendedOrigins: 'Recommended countries of origin',
      recommendedOriginsHelp: 'Origins that could offer tariff advantages for this product',
      additionalInfo: 'Additional recommendations',
      calculate: '💰 Calculate duties with this code',
    },

    alternatives: {
      title: 'Alternative Codes',
      subtitle: 'Other possible classifications depending on context',
      dutyRate: 'Duty:',
      inTaric: 'In TARIC',
      calculateWith: 'Calculate with this code →',
    },

    metadata: {
      classifiedBy: 'Classification performed by',
      dataSource: 'Data based on EUR-Lex updated Oct 2025',
    },
  },
}

// ── Landing page translations ──────────────────────────────

export const landingDict = {
  es: {
    header: {
      calculator: 'Calculadora',
      incoterms: 'Incoterms',
      cbam: 'CBAM',
      classifier: 'Clasificador IA',
      customsValue: 'Valor en Aduana',
      login: 'Acceder',
      cta: 'Empezar gratis',
    },

    hero: {
      badge: 'Datos TARIC actualizados — Abril 2026',
      titleLine1: 'Importaciones',
      titleLine2: 'a la UE,',
      titleHighlight: 'bajo control',
      subtitle: 'Aranceles TARIC oficiales, clasificación con IA, cumplimiento CBAM y EUDR. La plataforma que usan los profesionales del comercio exterior.',
      cta: 'Crear cuenta gratis',
      ctaSecondary: 'Explorar herramientas',
      scroll: 'Scroll',
    },

    tools: {
      sectionLabel: 'Herramientas',
      titleLine1: 'Todo lo que necesitas.',
      titleLine2: 'Nada que no.',
      items: [
        {
          title: 'Calculadora TARIC',
          headline: 'Aranceles al instante',
          description: 'Consulta aranceles, IVA, medidas y alertas de certificados en tiempo real para más de 49.700 códigos arancelarios con preferencias comerciales para 195 países.',
          features: ['49.700+ códigos', '195 países', 'Alertas de certificados', 'Medidas arancelarias', 'Preferencias comerciales'],
          cta: 'Abrir calculadora',
        },
        {
          title: 'Clasificador IA',
          headline: 'Describe, clasifica',
          description: 'Describe tu mercancía en lenguaje natural y obtén la partida arancelaria sugerida. Validación cruzada con la base TARIC oficial y explicación del razonamiento.',
          features: ['Lenguaje natural', 'Validación TARIC', 'Razonamiento IA', 'Múltiples sugerencias'],
          cta: 'Clasificar producto',
        },
        {
          title: 'Módulo CBAM',
          headline: 'Carbono en frontera',
          description: 'Verifica si tus importaciones están sujetas al CBAM, simula el coste por tonelada de CO₂ y genera autoevaluaciones completas con 573 códigos CN.',
          features: ['573 códigos CN', 'Simulador de costes', 'Self-Assessment', 'Asesoría profesional'],
          cta: 'Verificar CBAM',
        },
        {
          title: 'OEA',
          headline: 'Operador autorizado',
          description: 'Guía completa del Operador Económico Autorizado: modalidades OEAC/OEAS/OEAF, requisitos, procedimiento en España, beneficios y reconocimiento mutuo internacional.',
          features: ['3 modalidades', '5 criterios', 'Procedimiento AEAT', 'Reconocimiento mutuo'],
          cta: 'Consultar guía OEA',
        },
        {
          title: 'EUDR',
          headline: 'Deforestación cero',
          description: 'Consulta si tus importaciones están afectadas por el Reglamento de Deforestación (UE) 2023/1115. Guía regulatoria completa con productos, obligaciones y plazos.',
          features: ['Productos afectados', 'Obligaciones', 'Plazos clave', 'Guía regulatoria'],
          cta: 'Consultar EUDR',
        },
      ],
    },

    stats: {
      sectionLabel: 'Datos',
      titleLine1: 'Los números',
      titleLine2: 'hablan solos',
      items: [
        { label: 'Registros TARIC', sublabel: 'EUR-Lex oficiales' },
        { label: 'Códigos arancelarios', sublabel: 'Base completa' },
        { label: 'Códigos CN CBAM', sublabel: 'Cobertura total' },
        { label: 'Países', sublabel: 'Con preferencias' },
      ],
    },

    resources: {
      sectionLabel: 'Recursos',
      titleLine1: 'Guías profesionales',
      titleLine2: 'siempre a mano',
      items: [
        { title: 'Incoterms 2020', desc: 'Tabla interactiva COSTE/RIESGO, wizard de decisión ICC y guía de impacto aduanero.' },
        { title: 'Valor en Aduana', desc: 'Guía operativa de valoración: 6 métodos CAU, DV1, casillas DUA/H1 y casos reales.' },
        { title: 'Glosario', desc: 'Más de 200 términos de comercio exterior explicados para profesionales.' },
        { title: 'Tipos de Cambio', desc: '30 monedas oficiales del BCE con actualización mensual automática.' },
        { title: 'Cálculo Masivo', desc: 'Aranceles y costes para múltiples códigos en lote. Exporta CSV.' },
        { title: 'Despachos', desc: 'Gestiona operaciones de despacho con seguimiento y documentación.' },
      ],
    },

    audience: {
      sectionLabel: 'Para quién',
      title: 'Diseñado para profesionales',
      roles: [
        { title: 'Importadores', desc: 'Calcula costes antes de comprar, compara proveedores por país y clasifica productos sin conocer el código.' },
        { title: 'Agentes de Aduanas', desc: 'Verificación rápida de aranceles, alertas de certificados e IA como segundo criterio de clasificación.' },
        { title: 'Consultores', desc: 'Asesora con datos precisos, compara escenarios múltiples y genera informes profesionales para clientes.' },
      ],
    },

    compliance: {
      sectionLabel: 'Cumplimiento',
      title: 'Normativa europea al día',
      cbam: {
        subtitle: 'Obligatorio desde enero 2026',
        desc: 'Acero, aluminio, cemento, fertilizantes, electricidad e hidrógeno. Verifica si tus importaciones están afectadas.',
        cta: 'Verificar si aplica',
      },
      eudr: {
        subtitle: 'Reglamento de Deforestación',
        desc: 'Soja, aceite de palma, cacao, café, madera, caucho y ganado. Consulta si tus importaciones están afectadas.',
        cta: 'Consultar guía EUDR',
      },
      oea: {
        subtitle: 'Operador Económico Autorizado',
        desc: 'Certificación de confianza aduanera: menos controles, garantías reducidas y reconocimiento internacional.',
        cta: 'Consultar guía OEA',
      },
    },

    finalCta: {
      title: 'Empieza hoy',
      subtitle: 'Únete a profesionales que ya usan LexAduana para gestionar sus operaciones de comercio internacional con datos oficiales.',
      cta: 'Crear cuenta gratis',
      ctaSecondary: 'Probar la calculadora',
    },

    footer: {
      tagline: 'Suite Profesional de Comercio Exterior',
      desc: 'Plataforma de herramientas aduaneras para importaciones a la UE. Datos oficiales EUR-Lex actualizados mensualmente.',
      toolsTitle: 'Herramientas',
      toolsLinks: ['Calculadora TARIC', 'Clasificador IA', 'Módulo CBAM', 'Comparador', 'Cálculo Masivo', 'Gestor de Despachos'],
      resourcesTitle: 'Recursos',
      resourcesLinks: ['Incoterms 2020', 'Valor en Aduana', 'Glosario', 'Tipos de Cambio', 'EUDR'],
      legalTitle: 'Legal',
      legalLinks: ['Privacidad', 'Términos de Uso', 'Contacto'],
      copyright: '© 2024-2026 LexAduana. Todos los derechos reservados.',
      dataSource: 'Datos TARIC: EUR-Lex / Comisión Europea',
    },
  },

  en: {
    header: {
      calculator: 'Calculator',
      incoterms: 'Incoterms',
      cbam: 'CBAM',
      classifier: 'AI Classifier',
      customsValue: 'Customs Value',
      login: 'Sign in',
      cta: 'Start for free',
    },

    hero: {
      badge: 'TARIC data updated — April 2026',
      titleLine1: 'EU Imports,',
      titleLine2: '',
      titleHighlight: 'under control',
      subtitle: 'Official TARIC tariffs, AI classification, CBAM and EUDR compliance. The platform used by international trade professionals.',
      cta: 'Create free account',
      ctaSecondary: 'Explore tools',
      scroll: 'Scroll',
    },

    tools: {
      sectionLabel: 'Tools',
      titleLine1: 'Everything you need.',
      titleLine2: 'Nothing you don\'t.',
      items: [
        {
          title: 'TARIC Calculator',
          headline: 'Tariffs in an instant',
          description: 'Look up tariffs, VAT, measures and certificate alerts in real time for over 49,700 tariff codes with trade preferences for 195 countries.',
          features: ['49,700+ codes', '195 countries', 'Certificate alerts', 'Tariff measures', 'Trade preferences'],
          cta: 'Open calculator',
        },
        {
          title: 'AI Classifier',
          headline: 'Describe, classify',
          description: 'Describe your goods in natural language and get a suggested tariff heading. Cross-validated against the official TARIC database with reasoning explained.',
          features: ['Natural language', 'TARIC validation', 'AI reasoning', 'Multiple suggestions'],
          cta: 'Classify product',
        },
        {
          title: 'CBAM Module',
          headline: 'Carbon at the border',
          description: 'Check if your imports are subject to CBAM, simulate the cost per tonne of CO₂ and generate full self-assessments with 573 CN codes.',
          features: ['573 CN codes', 'Cost simulator', 'Self-Assessment', 'Professional advisory'],
          cta: 'Check CBAM',
        },
        {
          title: 'AEO',
          headline: 'Authorised operator',
          description: 'Complete guide to the Authorised Economic Operator: AEOC/AEOS/AEOF types, requirements, procedure in Spain, benefits and mutual international recognition.',
          features: ['3 types', '5 criteria', 'AEAT procedure', 'Mutual recognition'],
          cta: 'View AEO guide',
        },
        {
          title: 'EUDR',
          headline: 'Zero deforestation',
          description: 'Check if your imports are affected by the EU Deforestation Regulation 2023/1115. Full regulatory guide with products, obligations and deadlines.',
          features: ['Affected products', 'Obligations', 'Key deadlines', 'Regulatory guide'],
          cta: 'View EUDR guide',
        },
      ],
    },

    stats: {
      sectionLabel: 'Data',
      titleLine1: 'The numbers',
      titleLine2: 'speak for themselves',
      items: [
        { label: 'TARIC records', sublabel: 'Official EUR-Lex' },
        { label: 'Tariff codes', sublabel: 'Complete database' },
        { label: 'CBAM CN codes', sublabel: 'Full coverage' },
        { label: 'Countries', sublabel: 'With preferences' },
      ],
    },

    resources: {
      sectionLabel: 'Resources',
      titleLine1: 'Professional guides',
      titleLine2: 'always at hand',
      items: [
        { title: 'Incoterms 2020', desc: 'Interactive COST/RISK table, ICC decision wizard and customs value impact guide.' },
        { title: 'Customs Value', desc: 'Operational valuation guide: 6 UCC methods, DV1, DUA/H1 boxes and real cases.' },
        { title: 'Glossary', desc: 'Over 200 international trade terms explained for professionals.' },
        { title: 'Exchange Rates', desc: '30 official ECB currencies with automatic monthly updates.' },
        { title: 'Bulk Calculation', desc: 'Tariffs and costs for multiple codes in batch. Export CSV.' },
        { title: 'Dispatches', desc: 'Manage customs clearance operations with tracking and documentation.' },
      ],
    },

    audience: {
      sectionLabel: 'Who it\'s for',
      title: 'Designed for professionals',
      roles: [
        { title: 'Importers', desc: 'Calculate costs before purchasing, compare suppliers by country and classify products without knowing the code.' },
        { title: 'Customs Agents', desc: 'Quick tariff verification, certificate alerts and AI as a second classification opinion.' },
        { title: 'Consultants', desc: 'Advise with precise data, compare multiple scenarios and generate professional reports for clients.' },
      ],
    },

    compliance: {
      sectionLabel: 'Compliance',
      title: 'EU regulation up to date',
      cbam: {
        subtitle: 'Mandatory since January 2026',
        desc: 'Steel, aluminium, cement, fertilisers, electricity and hydrogen. Check if your imports are affected.',
        cta: 'Check if it applies',
      },
      eudr: {
        subtitle: 'Deforestation Regulation',
        desc: 'Soy, palm oil, cocoa, coffee, wood, rubber and cattle. Check if your imports are affected.',
        cta: 'View EUDR guide',
      },
      oea: {
        subtitle: 'Authorised Economic Operator',
        desc: 'EU customs trust certification: fewer controls, reduced guarantees and international recognition.',
        cta: 'View AEO guide',
      },
    },

    finalCta: {
      title: 'Start today',
      subtitle: 'Join professionals already using LexAduana to manage their international trade operations with official data.',
      cta: 'Create free account',
      ctaSecondary: 'Try the calculator',
    },

    footer: {
      tagline: 'Professional International Trade Suite',
      desc: 'Customs tools platform for EU imports. Official EUR-Lex data updated monthly.',
      toolsTitle: 'Tools',
      toolsLinks: ['TARIC Calculator', 'AI Classifier', 'CBAM Module', 'Comparator', 'Bulk Calculation', 'Dispatch Manager'],
      resourcesTitle: 'Resources',
      resourcesLinks: ['Incoterms 2020', 'Customs Value', 'Glossary', 'Exchange Rates', 'EUDR'],
      legalTitle: 'Legal',
      legalLinks: ['Privacy', 'Terms of Use', 'Contact'],
      copyright: '© 2024-2026 LexAduana. All rights reserved.',
      dataSource: 'TARIC Data: EUR-Lex / European Commission',
    },
  },
}

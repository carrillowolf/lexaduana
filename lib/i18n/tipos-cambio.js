// ── Tipos de Cambio page translations ───────────────────────

export const tiposCambioDict = {
  es: {
    upcoming: {
      title: 'Nuevos tipos de cambio publicados',
      effectiveFrom: 'Vigentes desde el',
    },
    current: {
      title: 'Tipos vigentes actualmente',
      effectiveLabel: 'Vigencia:',
      effectiveFrom: 'Desde el',
      boeRef: 'Referencia BOE:',
    },
    table: {
      code: 'Código',
      currency: 'Moneda',
      rate: '1 EUR =',
      currentRate: 'Actual',
      upcomingRate: 'Próximo',
      variation: 'Var.',
      filterPlaceholder: 'Filtrar por código o nombre',
      currencies: 'monedas',
      empty: 'No hay tipos de cambio cargados.',
      noMatch: 'Sin coincidencias para',
      legendUp: 'El euro se aprecia frente a esa moneda',
      legendDown: 'El euro se deprecia',
    },
    upcoming_section: {
      title: 'Tipos próximos',
    },
    legal: {
      title: 'Información legal',
      publication: 'Los tipos de cambio se publican el <strong>penúltimo miércoles de cada mes</strong> en el Boletín Oficial del Estado (BOE).',
      application: 'Según el <strong>Reglamento de Ejecución (UE) 2447/2015, artículo 146</strong>, estos tipos son aplicables a partir del <strong>primer día del mes siguiente</strong> a su publicación.',
    },
  },
  en: {
    upcoming: {
      title: 'New exchange rates published',
      effectiveFrom: 'Effective from',
    },
    current: {
      title: 'Currently effective rates',
      effectiveLabel: 'Validity:',
      effectiveFrom: 'From',
      boeRef: 'BOE reference:',
    },
    table: {
      code: 'Code',
      currency: 'Currency',
      rate: '1 EUR =',
      currentRate: 'Current',
      upcomingRate: 'Upcoming',
      variation: 'Chg.',
      filterPlaceholder: 'Filter by code or name',
      currencies: 'currencies',
      empty: 'No exchange rates loaded.',
      noMatch: 'No matches for',
      legendUp: 'Euro appreciates against this currency',
      legendDown: 'Euro depreciates',
    },
    upcoming_section: {
      title: 'Upcoming rates',
    },
    legal: {
      title: 'Legal information',
      publication: 'Exchange rates are published on the <strong>second-to-last Wednesday of each month</strong> in the Official State Gazette (BOE).',
      application: 'According to <strong>Implementing Regulation (EU) 2447/2015, Article 146</strong>, these rates apply from the <strong>first day of the month following</strong> their publication.',
    },
  },
}

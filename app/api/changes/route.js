/**
 * API de Cambios Arancelarios TARIC
 * Ruta: GET /api/changes
 *
 * Devuelve datos desglosados: separa cambios de medidas (impacto real)
 * de cambios de footnotes (ruido). Los datos provienen de taric_changes.
 *
 * Parámetros de query:
 *   ?months=all                    → Lista de meses disponibles
 *   ?month=2026-05                 → Resumen inteligente del mes
 *   ?month=2026-05&detail=true     → Detalle paginado
 *   ?goods_code=7208510000         → Cambios para una partida
 *   ?chapter=72                    → Cambios para un capítulo
 *   ?severity=critical             → Solo cambios de esa severidad
 *   ?page=1&per_page=50            → Paginación
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { checkRateLimit, generalLimiter, rateLimitHeaders } from '@/lib/rate-limit'

/** Nombres de capítulos TARIC en español */
const CHAPTER_NAMES = {
  '01': 'Animales vivos', '02': 'Carne y despojos comestibles',
  '03': 'Pescados, crustáceos y moluscos', '04': 'Leche, huevos, miel',
  '05': 'Otros productos de origen animal', '06': 'Plantas vivas y floricultura',
  '07': 'Legumbres y hortalizas', '08': 'Frutas y frutos comestibles',
  '09': 'Café, té, yerba mate y especias', '10': 'Cereales',
  '11': 'Productos de la molinería', '12': 'Semillas y frutos oleaginosos',
  '13': 'Gomas, resinas y extractos vegetales', '14': 'Materias trenzables',
  '15': 'Grasas y aceites', '16': 'Conservas de carne o pescado',
  '17': 'Azúcares y confitería', '18': 'Cacao y sus preparaciones',
  '19': 'Preparaciones de cereales', '20': 'Preparaciones de legumbres/frutas',
  '21': 'Preparaciones alimenticias diversas', '22': 'Bebidas, líquidos alcohólicos',
  '23': 'Residuos de industria alimentaria', '24': 'Tabaco y sucedáneos',
  '25': 'Sal, azufre, tierras y piedras', '26': 'Minerales, escorias y cenizas',
  '27': 'Combustibles y aceites minerales', '28': 'Productos químicos inorgánicos',
  '29': 'Productos químicos orgánicos', '30': 'Productos farmacéuticos',
  '31': 'Abonos', '32': 'Extractos curtientes, tintas',
  '33': 'Aceites esenciales, perfumería', '34': 'Jabones, ceras',
  '35': 'Materias albuminoideas, colas', '36': 'Pólvoras y explosivos',
  '37': 'Productos fotográficos', '38': 'Productos diversos de industria química',
  '39': 'Plásticos y sus manufacturas', '40': 'Caucho y sus manufacturas',
  '41': 'Pieles (excepto peletería)', '42': 'Manufacturas de cuero',
  '43': 'Peletería y confecciones', '44': 'Madera y sus manufacturas',
  '45': 'Corcho y sus manufacturas', '46': 'Manufacturas de espartería',
  '47': 'Pasta de madera, papel reciclado', '48': 'Papel y cartón',
  '49': 'Productos editoriales, prensa', '50': 'Seda',
  '51': 'Lana y pelo fino', '52': 'Algodón',
  '53': 'Otras fibras textiles vegetales', '54': 'Filamentos sintéticos o artificiales',
  '55': 'Fibras sintéticas discontinuas', '56': 'Guata, fieltro, cordelería',
  '57': 'Alfombras y revestimientos textiles', '58': 'Tejidos especiales, bordados',
  '59': 'Telas impregnadas, recubiertas', '60': 'Tejidos de punto',
  '61': 'Prendas de vestir de punto', '62': 'Prendas de vestir (no de punto)',
  '63': 'Artículos textiles confeccionados', '64': 'Calzado y sus partes',
  '65': 'Sombreros y tocados', '66': 'Paraguas, bastones',
  '67': 'Plumas y flores artificiales', '68': 'Manufacturas de piedra, yeso',
  '69': 'Productos cerámicos', '70': 'Vidrio y sus manufacturas',
  '71': 'Perlas, piedras preciosas, metales preciosos',
  '72': 'Fundición, hierro y acero', '73': 'Manufacturas de hierro o acero',
  '74': 'Cobre y sus manufacturas', '75': 'Níquel y sus manufacturas',
  '76': 'Aluminio y sus manufacturas', '78': 'Plomo y sus manufacturas',
  '79': 'Cinc y sus manufacturas', '80': 'Estaño y sus manufacturas',
  '81': 'Otros metales comunes', '82': 'Herramientas y cuchillería',
  '83': 'Manufacturas diversas de metal', '84': 'Máquinas y aparatos mecánicos',
  '85': 'Máquinas y material eléctrico', '86': 'Vehículos y material ferroviario',
  '87': 'Vehículos automóviles, tractores', '88': 'Aeronaves y vehículos espaciales',
  '89': 'Barcos y embarcaciones', '90': 'Instrumentos de óptica y precisión',
  '91': 'Relojería', '92': 'Instrumentos musicales',
  '93': 'Armas y municiones', '94': 'Muebles, iluminación',
  '95': 'Juguetes, juegos, artículos de deporte', '96': 'Manufacturas diversas',
  '97': 'Objetos de arte, colección',
}

/**
 * Extrae el valor numérico principal de una expresión de arancel TARIC.
 * Ejemplos:
 *   "5.800 %" → { value: 5.8, unit: '%' }
 *   "237.000 EUR TNE I" → { value: 237, unit: 'EUR TNE' }
 *   "Cond: A cert: D-008 (01):0.000 EUR TNE I ; A (01):172.200 EUR TNE I" → { value: 172.2, unit: 'EUR TNE' }
 */
function parseDutyValue(expr) {
  if (!expr) return null
  // Buscar todos los números con unidad
  const matches = [...expr.matchAll(/([\d]+(?:\.[\d]+)?)\s*(EUR\s*\w*|%)/gi)]
  if (matches.length === 0) return null
  // Tomar el mayor (el arancel efectivo, no la exención)
  let best = { value: 0, unit: '' }
  for (const m of matches) {
    const val = parseFloat(m[1])
    if (val > best.value) {
      best = { value: val, unit: m[2].trim() }
    }
  }
  return best.value > 0 ? best : null
}

/**
 * Clasifica y rankea los mayores cambios arancelarios del mes.
 * Para modified: calcula el delta entre old_value y new_value
 * Para added: rankea por el arancel impuesto
 */
function rankTopChanges(rows) {
  const scored = []

  for (const row of rows) {
    if (row.change_type === 'modified' && row.old_value && row.new_value) {
      const oldDuty = parseDutyValue(row.old_value)
      const newDuty = parseDutyValue(row.new_value)
      if (oldDuty && newDuty && oldDuty.unit === newDuty.unit) {
        const delta = newDuty.value - oldDuty.value
        const absDelta = Math.abs(delta)
        if (absDelta > 0.001) {
          scored.push({
            ...row,
            old_duty: oldDuty.value,
            new_duty: newDuty.value,
            delta,
            abs_delta: absDelta,
            unit: newDuty.unit,
            direction: delta > 0 ? 'up' : 'down',
            score: absDelta, // para ordenar
          })
        }
      } else if (oldDuty && newDuty) {
        // Unidades distintas — cambio de tipo de arancel
        scored.push({
          ...row,
          old_duty: oldDuty.value,
          new_duty: newDuty.value,
          delta: null,
          abs_delta: 0,
          unit: newDuty.unit,
          old_unit: oldDuty.unit,
          direction: 'changed',
          score: Math.max(oldDuty.value, newDuty.value),
        })
      }
    } else if (row.change_type === 'added') {
      const duty = parseDutyValue(row.duty_expression)
      if (duty && duty.value > 0) {
        scored.push({
          ...row,
          old_duty: 0,
          new_duty: duty.value,
          delta: duty.value,
          abs_delta: duty.value,
          unit: duty.unit,
          direction: 'new',
          score: duty.value * 0.8, // Ligeramente menos peso que un delta real
        })
      }
    }
  }

  // Deduplicar por goods_code (quedarnos con el de mayor score)
  const byCode = {}
  for (const item of scored) {
    const key = `${item.goods_code}_${item.measure_type_code}_${item.origin_code}`
    if (!byCode[key] || item.score > byCode[key].score) {
      byCode[key] = item
    }
  }

  return Object.values(byCode)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
}

export async function GET(request) {
  try {
    const rateLimit = await checkRateLimit(request, generalLimiter)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Demasiadas peticiones. Espera un momento.' },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      )
    }

    const { searchParams } = new URL(request.url)
    const headers = {
      ...rateLimitHeaders(rateLimit),
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    }

    // ── ?months=all ──
    if (searchParams.get('months') === 'all') {
      const { data, error } = await supabaseAdmin
        .from('taric_changes_summary')
        .select('*')
        .order('data_month', { ascending: false })

      if (error) throw error

      return NextResponse.json({
        success: true,
        months: (data || []).map(row => ({
          month: row.data_month,
          total_changes: row.total_changes,
          critical: row.critical_changes,
          affected_codes: row.affected_codes,
        })),
      }, { headers })
    }

    // Determinar mes
    let month = searchParams.get('month')
    if (!month) {
      const { data } = await supabaseAdmin
        .from('taric_changes_summary')
        .select('data_month')
        .order('data_month', { ascending: false })
        .limit(1)
        .single()

      if (!data) {
        return NextResponse.json({
          success: true, month: null, summary: null,
          message: 'No hay datos de cambios disponibles todavía.',
        }, { headers })
      }
      month = data.data_month
    }

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: 'Formato de mes inválido. Usar YYYY-MM.' },
        { status: 400, headers }
      )
    }

    // ── ?goods_code=... ──
    const goodsCode = searchParams.get('goods_code')
    if (goodsCode) {
      const code = goodsCode.replace(/\s/g, '').padStart(10, '0').substring(0, 10)
      const { data, error } = await supabaseAdmin
        .from('taric_changes')
        .select('*')
        .eq('goods_code', code)
        .order('data_month', { ascending: false })
        .limit(100)
      if (error) throw error
      return NextResponse.json({ success: true, goods_code: code, changes: data || [] }, { headers })
    }

    // ── Resumen inteligente del mes ──
    // Query desglosada: medidas vs condiciones vs footnotes, por capítulo
    let rawChapters = null, chErr = null
    try {
      const rpcResult = await supabaseAdmin.rpc('get_changes_by_chapter', { p_month: month })
      rawChapters = rpcResult.data
      chErr = rpcResult.error
    } catch {
      chErr = true
    }

    // Fallback: query directa si la función RPC no existe
    let chapterData
    if (chErr || !rawChapters) {
      const { data, error } = await supabaseAdmin
        .from('taric_changes')
        .select('chapter, table_name, change_type, severity')
        .eq('data_month', month)

      if (error) throw error
      // Agregar manualmente
      const map = {}
      for (const row of (data || [])) {
        const ch = row.chapter
        if (!map[ch]) map[ch] = { chapter: ch, measures: 0, measures_added: 0, measures_removed: 0, measures_modified: 0, conditions: 0, conditions_added: 0, exclusions: 0, footnotes: 0, critical: 0 }
        const m = map[ch]
        if (row.table_name === 'taric_measures') {
          m.measures++
          if (row.change_type === 'added') m.measures_added++
          if (row.change_type === 'removed') m.measures_removed++
          if (row.change_type === 'modified') m.measures_modified++
        } else if (row.table_name === 'measure_conditions') {
          m.conditions++
          if (row.change_type === 'added') m.conditions_added++
        } else if (row.table_name === 'measure_exclusions') {
          m.exclusions++
        } else {
          m.footnotes++
        }
        if (row.severity === 'critical') m.critical++
      }
      chapterData = Object.values(map)
    } else {
      chapterData = rawChapters
    }

    // Construir respuesta de capítulos — orden ascendente por número
    const byChapter = chapterData
      .map(ch => ({
        chapter: ch.chapter,
        name: CHAPTER_NAMES[ch.chapter] || `Capítulo ${ch.chapter}`,
        measures: ch.measures || 0,
        measures_added: ch.measures_added || 0,
        measures_removed: ch.measures_removed || 0,
        measures_modified: ch.measures_modified || 0,
        conditions: ch.conditions || 0,
        conditions_added: ch.conditions_added || 0,
        exclusions: ch.exclusions || 0,
        footnotes: ch.footnotes || 0,
        critical: ch.critical || 0,
      }))
      .sort((a, b) => a.chapter.localeCompare(b.chapter))

    // Totales globales desglosados
    const totals = byChapter.reduce((acc, ch) => {
      acc.measures += ch.measures
      acc.measures_added += ch.measures_added
      acc.measures_removed += ch.measures_removed
      acc.measures_modified += ch.measures_modified
      acc.conditions += ch.conditions
      acc.conditions_added += ch.conditions_added
      acc.exclusions += ch.exclusions
      acc.footnotes += ch.footnotes
      acc.critical += ch.critical
      return acc
    }, { measures: 0, measures_added: 0, measures_removed: 0, measures_modified: 0, conditions: 0, conditions_added: 0, exclusions: 0, footnotes: 0, critical: 0 })

    const totalAll = totals.measures + totals.conditions + totals.exclusions + totals.footnotes
    const chaptersWithMeasures = byChapter.filter(ch => ch.measures > 0).length

    // ── Top cambios críticos (highlights) ──
    const { data: highlights } = await supabaseAdmin
      .from('taric_changes')
      .select('*')
      .eq('data_month', month)
      .eq('severity', 'critical')
      .order('chapter', { ascending: true })
      .limit(15)

    // ── Top mayores cambios (modified + added con aranceles altos) ──
    const { data: topRaw } = await supabaseAdmin
      .from('taric_changes')
      .select('*')
      .eq('data_month', month)
      .eq('table_name', 'taric_measures')
      .in('change_type', ['modified', 'added'])
      .not('duty_expression', 'is', null)
      .order('severity', { ascending: true })
      .limit(200)

    const topChanges = rankTopChanges(topRaw || [])

    // ── ?detail=true → Detalle paginado ──
    const wantDetail = searchParams.get('detail') === 'true'
    const chapter = searchParams.get('chapter')
    const severity = searchParams.get('severity')

    if (wantDetail || chapter || severity) {
      const page = Math.max(1, parseInt(searchParams.get('page')) || 1)
      const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page')) || 50))
      const from = (page - 1) * perPage
      const to = from + perPage - 1

      let query = supabaseAdmin
        .from('taric_changes')
        .select('*', { count: 'exact' })
        .eq('data_month', month)

      if (chapter) query = query.eq('chapter', chapter)
      if (severity) query = query.eq('severity', severity)

      // Excluir footnotes por defecto en el detail (salvo que pidan severity=info)
      if (!severity) query = query.neq('table_name', 'measure_footnotes')

      query = query
        .order('severity', { ascending: true })
        .order('table_name', { ascending: true })
        .order('chapter', { ascending: true })
        .range(from, to)

      const { data, error, count } = await query
      if (error) throw error

      return NextResponse.json({
        success: true, month,
        summary: { ...totals, total: totalAll, chapters_with_measures: chaptersWithMeasures },
        by_chapter: byChapter,
        changes: data || [],
        top_changes: topChanges,
        pagination: { page, per_page: perPage, total: count || 0, total_pages: Math.ceil((count || 0) / perPage) },
      }, { headers })
    }

    // ── Respuesta resumen ──
    return NextResponse.json({
      success: true,
      month,
      summary: {
        ...totals,
        total: totalAll,
        chapters_with_measures: chaptersWithMeasures,
      },
      by_chapter: byChapter,
      highlights: highlights || [],
      top_changes: topChanges,
    }, { headers })

  } catch (error) {
    console.error('Error en /api/changes:', error)
    return NextResponse.json(
      { error: 'Error al consultar cambios arancelarios' },
      { status: 500 }
    )
  }
}

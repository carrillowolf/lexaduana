# LexAduana — Notas para Claude Code

## Actualización mensual de datos TARIC

Cada mes, cuando lleguen los nuevos Excel de CIRCABC/EUR-Lex, ejecutar en este orden:

```bash
# 1. El usuario deja los 14 Excel en data/nuevo-mes/

# 2. Detectar cambios ANTES de cargar datos nuevos (dry-run primero)
node scripts/detectChanges.js --month=YYYY-MM --dry-run
node scripts/detectChanges.js --month=YYYY-MM

# 3. Cargar los datos nuevos
node scripts/loadBlock1.js
node scripts/loadBlock2.js
node scripts/loadBlock3.js
```

### Archivos necesarios de CIRCABC (14 Excel)

**Block 2 (requeridos para detectChanges):**
- Duties Import 01-99.xlsx
- Measure conditions.xlsx
- Measure exclusions.xlsx
- Measure footnotes.xlsx

**Block 1 (master data):**
- Geographical areas composition.xlsx / description.xlsx
- Nomenclature EN.xlsx, Declarable codes.xlsx, Box 44 codes of the SAD.xlsx

**Block 3 (lookup tables):**
- Footnotes descriptions.xlsx, Additional codes descriptions.xlsx
- CCT Exchange rates.xlsx, Legal basis.xlsx

### Orden importante

detectChanges compara Excel nuevo vs datos actuales en Supabase,
así que debe ejecutarse ANTES de que loadBlock sobreescriba los datos.

Los cambios detectados se muestran en `/cambios` automáticamente.

### Fuente de descarga CIRCABC

Los Excel se descargan de:
https://circabc.europa.eu/ui/group/0e5f18c2-4b2f-42e9-aed4-dfe50ae1263b/library/566dd333-1deb-4235-982a-4fdeaf3657c1

---

## Pull Requests — auto-suscripción

Tras crear un PR con `mcp__github__create_pull_request`, suscríbete siempre
inmediatamente con `mcp__github__subscribe_pr_activity` al mismo PR — sin
preguntar. Así se reciben eventos de CI y review comments durante toda la
sesión y puedo reaccionar (fix pequeño, pregunta si es ambiguo, skip si no
aplica) sin tener que pedirme que active el watcher cada vez.

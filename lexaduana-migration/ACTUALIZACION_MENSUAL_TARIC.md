# 📅 Guía de Actualización Mensual TARIC

## Cuándo actualizar
**Primer día de cada mes** (o cuando EUR-Lex publique los nuevos datos)

---

## Paso 1: Descargar los Excel de EUR-Lex

Descarga estos 3 archivos del CIRCABC/EUR-Lex:
- `Duties_Import_[MES].xlsx`
- `Measure_conditions_[MES].xlsx`  
- `Measure_exclusions_[MES].xlsx`

---

## Paso 2: Copiar a la carpeta de migración

```bash
cd ~/Desktop/lexaduana/lexaduana-migration

# Copiar y renombrar (reemplaza los archivos existentes)
cp ~/Downloads/Duties_Import_*.xlsx ./Duties_Import_Diciembre.xlsx
cp ~/Downloads/Measure_conditions*.xlsx ./Measure_conditions.xlsx
cp ~/Downloads/Measure_exclusions*.xlsx ./Measure_exclusions.xlsx
```

---

## Paso 3: Ejecutar importación

```bash
# Asegúrate de estar en la carpeta correcta
cd ~/Desktop/lexaduana/lexaduana-migration

# Importar (cada comando tarda 1-2 minutos)
node import-all-taric.js measures
node import-all-taric.js conditions
node import-all-taric.js exclusions
```

---

## ✅ Verificar que funcionó

Deberías ver algo como:
```
✅ Insertados: ~141.000 (measures)
✅ Insertados: ~31.000 (conditions)
✅ Insertados: ~35.000 (exclusions)
```

---

## ⚠️ Si hay errores "value too long"

Ejecuta en Supabase SQL Editor:
```sql
ALTER TABLE taric_measures ALTER COLUMN origin_name TYPE VARCHAR(300);
ALTER TABLE taric_measures ALTER COLUMN measure_type_name TYPE VARCHAR(300);
ALTER TABLE measure_exclusions ALTER COLUMN origin_name TYPE VARCHAR(300);
```

Y vuelve a ejecutar el import que falló.

---

## 📝 Notas

- **No necesitas hacer deploy** - los datos se actualizan directamente en Supabase
- **No se pierden datos** - el script borra lo viejo e inserta lo nuevo
- **Tiempo total**: ~5 minutos
- **Mejor hora**: Por la mañana temprano (menos usuarios)

---

## Archivos en esta carpeta

| Archivo | Para qué |
|---------|----------|
| `import-all-taric.js` | Script de importación |
| `Duties_Import_Diciembre.xlsx` | Datos de aranceles |
| `Measure_conditions.xlsx` | Certificados requeridos |
| `Measure_exclusions.xlsx` | Países excluidos |

---

*Última actualización: Diciembre 2025*

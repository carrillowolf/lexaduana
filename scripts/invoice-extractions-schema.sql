-- =============================================================
-- LexAduana — Tabla de extracciones de facturas (OCR + IA)
-- =============================================================
-- Almacena ÚNICAMENTE los datos extraídos en JSON estructurado.
-- El archivo PDF/imagen original NUNCA se persiste.
--
-- Cumplimiento GDPR:
--  - Soft-delete (deleted_at) para borrado reversible por el usuario.
--  - RLS estricto: cada usuario solo accede a sus propias extracciones.
--  - Limpieza automática recomendada a 90 días (cron en Supabase).
-- =============================================================

CREATE TABLE IF NOT EXISTS invoice_extractions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Metadatos del archivo (sin contenido)
  file_name TEXT,
  file_mime TEXT,

  -- Cabecera de la factura (denormalizado para listados rápidos)
  invoice_number TEXT,
  supplier_name TEXT,
  supplier_country TEXT,
  currency TEXT,
  incoterm TEXT,
  total_amount NUMERIC(14, 2),
  lines_count INTEGER DEFAULT 0,

  -- Datos completos extraídos por la IA
  extracted_data JSONB NOT NULL,

  -- Issues de la validación cruzada
  validation_issues JSONB DEFAULT '[]'::jsonb,

  -- Resultados de cálculo (si el usuario los ejecuta luego)
  calculation_results JSONB,

  -- Telemetría
  tokens_used INTEGER DEFAULT 0,

  -- Soft-delete (GDPR)
  deleted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_invoice_extractions_user
  ON invoice_extractions(user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_invoice_extractions_created
  ON invoice_extractions(created_at DESC);

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
ALTER TABLE invoice_extractions ENABLE ROW LEVEL SECURITY;

-- Importante: separar SELECT/INSERT/UPDATE/DELETE para que el
-- soft-delete (UPDATE que pone deleted_at = now()) no falle por
-- la condición "deleted_at IS NULL" del WITH CHECK.

DROP POLICY IF EXISTS "invoice_extractions_select_own"   ON invoice_extractions;
DROP POLICY IF EXISTS "invoice_extractions_insert_own"   ON invoice_extractions;
DROP POLICY IF EXISTS "invoice_extractions_update_own"   ON invoice_extractions;
DROP POLICY IF EXISTS "invoice_extractions_delete_own"   ON invoice_extractions;

-- Solo se ven las propias y NO eliminadas
CREATE POLICY "invoice_extractions_select_own"
  ON invoice_extractions FOR SELECT
  USING (user_id = auth.uid() AND deleted_at IS NULL);

-- Insert: la fila debe ser del propio usuario
CREATE POLICY "invoice_extractions_insert_own"
  ON invoice_extractions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Update: el usuario puede modificar sus filas (incluido marcar deleted_at)
-- USING permite tocar incluso filas ya marcadas como eliminadas (para revertir)
CREATE POLICY "invoice_extractions_update_own"
  ON invoice_extractions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Delete duro (raro: preferimos soft-delete)
CREATE POLICY "invoice_extractions_delete_own"
  ON invoice_extractions FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================
-- Trigger: updated_at automático
-- =============================================================
CREATE OR REPLACE FUNCTION set_invoice_extractions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invoice_extractions_updated_at ON invoice_extractions;
CREATE TRIGGER trg_invoice_extractions_updated_at
  BEFORE UPDATE ON invoice_extractions
  FOR EACH ROW
  EXECUTE FUNCTION set_invoice_extractions_updated_at();

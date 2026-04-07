-- ============================================
-- CBAM PHASE 3: PANEL ADMIN + GENERACIÓN PDF + ENTREGA
-- ============================================
-- Ejecutar DESPUÉS de cbam-advisory-schema.sql (Phase 2).
-- Construye encima de las tablas existentes. NO modifica datos.
--
-- Orden de ejecución:
--   1. Ampliar CHECK constraint de cbam_advisory_requests.status
--   2. Añadir columnas nuevas a cbam_advisory_requests
--   3. Crear tabla cbam_advisory_reports
--   4. Crear tabla cbam_advisory_report_downloads
--   5. Crear función transaccional para versionado
--   6. Habilitar RLS y políticas en las tablas nuevas
--   7. Crear bucket de Storage (manual desde el dashboard)

-- ============================================
-- 1. Ampliar CHECK constraint de status
-- ============================================
-- Estados existentes: draft, intake_complete, analyzing, pending_supplier_data,
--                     calculating, report_ready, delivered, cancelled
-- Nuevos estados: reviewing, pending_payment, paid

ALTER TABLE cbam_advisory_requests
  DROP CONSTRAINT IF EXISTS cbam_advisory_requests_status_check;

ALTER TABLE cbam_advisory_requests
  ADD CONSTRAINT cbam_advisory_requests_status_check
  CHECK (status IN (
    'draft',
    'intake_complete',
    'analyzing',
    'pending_supplier_data',
    'calculating',
    'reviewing',
    'report_ready',
    'pending_payment',
    'paid',
    'delivered',
    'cancelled'
  ));

-- ============================================
-- 2. Nuevas columnas en cbam_advisory_requests
-- ============================================
-- NOTA: NO se crea admin_notes (se reutiliza internal_notes existente).
-- NOTA: NO se crea client_email (se reutiliza contact_email existente).

ALTER TABLE cbam_advisory_requests
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'invoiced', 'paid'));

ALTER TABLE cbam_advisory_requests
  ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ;

ALTER TABLE cbam_advisory_requests
  ADD COLUMN IF NOT EXISTS invoice_ref TEXT;

ALTER TABLE cbam_advisory_requests
  ADD COLUMN IF NOT EXISTS report_generated_at TIMESTAMPTZ;

ALTER TABLE cbam_advisory_requests
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Referencia autogenerada del informe (ej. LA-CBAM-2027-0045)
ALTER TABLE cbam_advisory_requests
  ADD COLUMN IF NOT EXISTS report_ref TEXT UNIQUE;

-- ============================================
-- 3. Tabla cbam_advisory_reports
-- ============================================
CREATE TABLE IF NOT EXISTS cbam_advisory_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES cbam_advisory_requests(id) ON DELETE CASCADE,

  -- PDF storage
  pdf_path TEXT NOT NULL,           -- ruta dentro del bucket cbam-advisory-reports
  pdf_filename TEXT NOT NULL,       -- nombre sugerido al descargar
  pdf_size_bytes INTEGER,

  -- Metadatos del informe
  report_ref TEXT NOT NULL,         -- ej: LA-CBAM-2027-0045 (mismo que en requests)
  report_year INTEGER NOT NULL,

  -- Snapshot completo de los datos y resultados con los que se generó el PDF.
  -- Permite regenerar/auditar sin depender del estado actual de products.
  calculation_snapshot JSONB NOT NULL,

  -- Versionado
  version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,

  -- Auditoría
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by TEXT,                -- email del admin que generó el informe

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_advisory_reports_request
  ON cbam_advisory_reports(request_id);

-- Solo puede haber UN informe current por solicitud
CREATE UNIQUE INDEX IF NOT EXISTS idx_advisory_reports_unique_current
  ON cbam_advisory_reports(request_id)
  WHERE is_current = TRUE;

-- ============================================
-- 4. Tabla cbam_advisory_report_downloads (auditoría)
-- ============================================
CREATE TABLE IF NOT EXISTS cbam_advisory_report_downloads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES cbam_advisory_reports(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES cbam_advisory_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_advisory_downloads_report
  ON cbam_advisory_report_downloads(report_id);
CREATE INDEX IF NOT EXISTS idx_advisory_downloads_request
  ON cbam_advisory_report_downloads(request_id);

-- ============================================
-- 5. Función transaccional para crear nueva versión de informe
-- ============================================
-- Garantiza atomicidad: marca todas las versiones anteriores como is_current = FALSE
-- y crea la nueva como current. Evita race conditions si el admin regenera dos veces.

CREATE OR REPLACE FUNCTION create_advisory_report_version(
  p_request_id UUID,
  p_pdf_path TEXT,
  p_pdf_filename TEXT,
  p_pdf_size_bytes INTEGER,
  p_report_ref TEXT,
  p_report_year INTEGER,
  p_calculation_snapshot JSONB,
  p_generated_by TEXT
) RETURNS UUID AS $$
DECLARE
  v_new_version INTEGER;
  v_new_id UUID;
BEGIN
  -- Calcular siguiente número de versión
  SELECT COALESCE(MAX(version), 0) + 1
    INTO v_new_version
    FROM cbam_advisory_reports
    WHERE request_id = p_request_id;

  -- Marcar versiones previas como no current
  UPDATE cbam_advisory_reports
    SET is_current = FALSE
    WHERE request_id = p_request_id
      AND is_current = TRUE;

  -- Insertar la nueva versión como current
  INSERT INTO cbam_advisory_reports (
    request_id, pdf_path, pdf_filename, pdf_size_bytes,
    report_ref, report_year, calculation_snapshot,
    version, is_current, generated_by
  ) VALUES (
    p_request_id, p_pdf_path, p_pdf_filename, p_pdf_size_bytes,
    p_report_ref, p_report_year, p_calculation_snapshot,
    v_new_version, TRUE, p_generated_by
  )
  RETURNING id INTO v_new_id;

  -- Actualizar timestamps en el request padre
  UPDATE cbam_advisory_requests
    SET report_generated_at = NOW(),
        updated_at = NOW()
    WHERE id = p_request_id;

  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. RLS en las tablas nuevas
-- ============================================
-- Filosofía: las rutas admin usan service_role (bypassa RLS).
-- Las policies aquí solo controlan acceso del cliente final.

ALTER TABLE cbam_advisory_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbam_advisory_report_downloads ENABLE ROW LEVEL SECURITY;

-- Cliente: puede leer SOLO informes de sus propias solicitudes Y solo si están
-- en estado paid o delivered (no antes del pago).
CREATE POLICY "Client reads own released reports"
  ON cbam_advisory_reports FOR SELECT
  USING (
    request_id IN (
      SELECT id FROM cbam_advisory_requests
      WHERE user_id = auth.uid()
        AND status IN ('paid', 'delivered')
    )
  );

-- Cliente: puede registrar sus propias descargas
CREATE POLICY "Client logs own downloads"
  ON cbam_advisory_report_downloads FOR INSERT
  WITH CHECK (
    request_id IN (
      SELECT id FROM cbam_advisory_requests
      WHERE user_id = auth.uid()
        AND status IN ('paid', 'delivered')
    )
  );

CREATE POLICY "Client reads own download history"
  ON cbam_advisory_report_downloads FOR SELECT
  USING (
    request_id IN (
      SELECT id FROM cbam_advisory_requests
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 7. PASOS MANUALES EN SUPABASE DASHBOARD
-- ============================================
-- A) Storage > New bucket:
--      Nombre: cbam-advisory-reports
--      Public: NO (privado, solo signed URLs)
--      File size limit: 20 MB
--      Allowed MIME types: application/pdf
--
-- B) Storage > Policies para bucket cbam-advisory-reports:
--      No es necesario crear policies de acceso público.
--      El acceso se hace siempre vía signed URLs generadas desde el backend
--      con el service_role key (que bypassa todas las policies).
--
-- C) Variables de entorno (.env.local y Vercel):
--      ADMIN_EMAILS=ccarrillodelolmo@gmail.com
--      RESEND_API_KEY=re_xxxxx                 (generar en resend.com)
--      RESEND_FROM_EMAIL=cbam@lexaduana.es
--
-- D) Verificación post-migración:
--      - SELECT constraint_name, check_clause FROM information_schema.check_constraints
--        WHERE constraint_name LIKE '%advisory_requests_status%';
--      - \d cbam_advisory_requests   (debe tener payment_status, payment_date, etc.)
--      - \d cbam_advisory_reports    (tabla nueva)
--      - \d cbam_advisory_report_downloads
--      - SELECT proname FROM pg_proc WHERE proname = 'create_advisory_report_version';
-- ============================================

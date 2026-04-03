-- ============================================
-- CBAM PHASE 2: SERVICIO DE ASESORÍA PREMIUM
-- ============================================
-- Ejecutar DESPUÉS del schema existente (cbam-schema.sql)
-- NO modifica ninguna tabla existente
--
-- Tablas: 13, 14, 15 (continúan la numeración del schema Phase 1)

-- 13. cbam_advisory_requests (solicitud principal)
CREATE TABLE cbam_advisory_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Estado del flujo
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'intake_complete', 'analyzing', 'pending_supplier_data', 'calculating', 'report_ready', 'delivered', 'cancelled')),

  -- Datos de empresa (Paso 1 - Intake)
  company_name TEXT NOT NULL,
  company_cif TEXT,
  company_eori TEXT,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,

  -- Contexto de importación
  annual_volume_estimate TEXT,
  is_authorized_declarant BOOLEAN DEFAULT FALSE,
  has_indirect_representative BOOLEAN DEFAULT FALSE,
  representative_name TEXT,

  -- Notas del cliente y del asesor
  client_notes TEXT,
  internal_notes TEXT,

  -- Resultado global (se calcula al procesar)
  total_estimated_cost NUMERIC(12,2),
  total_tonnes NUMERIC(10,2),
  total_emissions NUMERIC(10,4),
  exceeds_de_minimis BOOLEAN,

  -- Metadatos
  co2_price_used NUMERIC(10,2),
  calculation_year INTEGER DEFAULT 2026,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- 14. cbam_advisory_products (líneas de producto por solicitud)
CREATE TABLE cbam_advisory_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES cbam_advisory_requests(id) ON DELETE CASCADE,

  -- Identificación del producto
  product_description TEXT NOT NULL,
  cn_code TEXT,
  cn_code_detected TEXT,
  sector_id TEXT,

  -- Origen y volumen
  country_code TEXT NOT NULL,
  country_name TEXT,
  annual_tonnes NUMERIC(10,2) NOT NULL,

  -- Proveedor
  supplier_name TEXT,
  supplier_contact_email TEXT,
  supplier_installation_name TEXT,
  supplier_installation_country TEXT,

  -- Datos de emisiones (si el cliente los tiene)
  has_real_emissions BOOLEAN DEFAULT FALSE,
  emission_factor_real NUMERIC(10,4),
  emission_source TEXT DEFAULT 'default'
    CHECK (emission_source IN ('real', 'default', 'pending')),
  production_route TEXT,

  -- Resultados del cálculo (se rellenan al procesar)
  emission_factor_applied NUMERIC(10,4),
  benchmark_applied NUMERIC(10,4),
  emissions_subject_to_cbam NUMERIC(10,4),
  total_emissions NUMERIC(10,4),
  total_cost NUMERIC(12,2),
  markup_applied NUMERIC(5,2),

  -- Escenario dual
  cost_with_real NUMERIC(12,2),
  cost_with_default NUMERIC(12,2),
  savings_potential NUMERIC(12,2),

  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. cbam_advisory_documents (archivos subidos por el cliente)
CREATE TABLE cbam_advisory_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES cbam_advisory_requests(id) ON DELETE CASCADE,

  file_name TEXT NOT NULL,
  file_type TEXT
    CHECK (file_type IN ('dua', 'invoice', 'supplier_data', 'certificate', 'other')),
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,

  notes TEXT,

  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_advisory_requests_user ON cbam_advisory_requests(user_id);
CREATE INDEX idx_advisory_requests_status ON cbam_advisory_requests(status);
CREATE INDEX idx_advisory_products_request ON cbam_advisory_products(request_id);
CREATE INDEX idx_advisory_documents_request ON cbam_advisory_documents(request_id);

-- RLS
ALTER TABLE cbam_advisory_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbam_advisory_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbam_advisory_documents ENABLE ROW LEVEL SECURITY;

-- Políticas: el usuario solo ve sus propias solicitudes
CREATE POLICY "Users can view own requests"
  ON cbam_advisory_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own requests"
  ON cbam_advisory_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own draft requests"
  ON cbam_advisory_requests FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('draft', 'intake_complete'));

-- Productos: acceso a través de la solicitud del usuario
CREATE POLICY "Users can view own products"
  ON cbam_advisory_products FOR SELECT
  USING (request_id IN (SELECT id FROM cbam_advisory_requests WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own products"
  ON cbam_advisory_products FOR INSERT
  WITH CHECK (request_id IN (SELECT id FROM cbam_advisory_requests WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own products"
  ON cbam_advisory_products FOR UPDATE
  USING (request_id IN (SELECT id FROM cbam_advisory_requests WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own products"
  ON cbam_advisory_products FOR DELETE
  USING (request_id IN (SELECT id FROM cbam_advisory_requests WHERE user_id = auth.uid()));

-- Documentos: acceso a través de la solicitud del usuario
CREATE POLICY "Users can view own documents"
  ON cbam_advisory_documents FOR SELECT
  USING (request_id IN (SELECT id FROM cbam_advisory_requests WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own documents"
  ON cbam_advisory_documents FOR INSERT
  WITH CHECK (request_id IN (SELECT id FROM cbam_advisory_requests WHERE user_id = auth.uid()));

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_advisory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_advisory_requests_updated
  BEFORE UPDATE ON cbam_advisory_requests
  FOR EACH ROW EXECUTE FUNCTION update_advisory_updated_at();

CREATE TRIGGER trg_advisory_products_updated
  BEFORE UPDATE ON cbam_advisory_products
  FOR EACH ROW EXECUTE FUNCTION update_advisory_updated_at();

-- ============================================
-- PASOS MANUALES EN SUPABASE DASHBOARD:
-- ============================================
-- 1. Storage > New bucket:
--    - Nombre: cbam-advisory-docs
--    - Public: NO (privado)
--    - File size limit: 10MB
--    - Allowed MIME types: application/pdf, image/jpeg, image/png,
--      application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
--      application/vnd.ms-excel, text/csv
--
-- 2. Storage > Policies para bucket cbam-advisory-docs:
--    - SELECT: authenticated users can read files in their own folder
--      (folder path = user_id/*)
--    - INSERT: authenticated users can upload to their own folder
--    Ejemplo de policy:
--      bucket_id = 'cbam-advisory-docs'
--      AND auth.uid()::text = (storage.foldername(name))[1]
-- ============================================

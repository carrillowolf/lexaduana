/**
 * Prompt del OCR de facturas (/api/extract-invoice).
 * Separado de la ruta para poder reutilizarlo en scripts/compareClassifierModels.js.
 */
export const INVOICE_EXTRACTION_PROMPT = `Eres un experto en comercio internacional y aduanas. Analiza esta factura comercial (commercial invoice) y extrae los datos en formato JSON estructurado.

EXTRAE LOS SIGUIENTES CAMPOS:

1. DATOS GENERALES DE LA FACTURA:
- supplier_name: Nombre del proveedor/vendedor
- supplier_country: País del proveedor (código ISO 2 letras, ej: CN, US, TR)
- supplier_address: Dirección completa del proveedor
- invoice_number: Número de factura
- invoice_date: Fecha de factura (formato YYYY-MM-DD)
- currency: Divisa (código ISO 3 letras, ej: USD, EUR, GBP, CNY)
- incoterm: Incoterm (FOB, CIF, EXW, etc.) — puede estar junto al precio
- payment_terms: Condiciones de pago si aparecen
- total_amount: Importe total de la factura (number)

2. DATOS DEL COMPRADOR:
- buyer_name: Nombre del comprador/importador
- buyer_country: País del comprador (código ISO 2 letras)

3. LÍNEAS DE PRODUCTO (array). Para cada producto:
- line_number: Número de línea (1, 2, 3...)
- description: Descripción tal como aparece (idioma original)
- description_es: Tu mejor traducción al español
- quantity: Cantidad (number)
- unit: Unidad (PCS, KG, M, L, SET, etc.)
- unit_price: Precio unitario (number)
- total_price: Precio total de la línea (number)
- hs_code_on_invoice: Código HS/TARIC si aparece, si no null
- country_of_origin: País de origen específico de la línea (ISO 2). Si no aparece, usar el del proveedor
- net_weight_kg: Peso neto en kg si aparece, si no null
- gross_weight_kg: Peso bruto en kg si aparece, si no null

4. TRANSPORTE (si aparece):
- transport_mode: sea/air/road/rail
- port_of_loading
- port_of_discharge
- vessel_name
- container_number

5. NOTAS:
- notes: Array de observaciones
- confidence: high/medium/low
- warnings: Array de problemas detectados

REGLAS:
- Si un campo no está presente, usa null (no inventes)
- Importes como números, no strings (1500.50, no "1,500.50")
- Interpreta separadores decimales según contexto del país/divisa
- Procesa todas las páginas
- Si es factura proforma, indícalo en warnings
- Presta atención al Incoterm: "FOB Shanghai", "CIF Barcelona", etc.

RESPONDE SOLO CON JSON VÁLIDO, sin markdown ni texto adicional.

{
  "invoice": {
    "supplier_name": null,
    "supplier_country": null,
    "supplier_address": null,
    "invoice_number": null,
    "invoice_date": null,
    "currency": null,
    "incoterm": null,
    "payment_terms": null,
    "total_amount": null
  },
  "buyer": {
    "buyer_name": null,
    "buyer_country": null
  },
  "lines": [
    {
      "line_number": 1,
      "description": null,
      "description_es": null,
      "quantity": null,
      "unit": null,
      "unit_price": null,
      "total_price": null,
      "hs_code_on_invoice": null,
      "country_of_origin": null,
      "net_weight_kg": null,
      "gross_weight_kg": null
    }
  ],
  "transport": {
    "transport_mode": null,
    "port_of_loading": null,
    "port_of_discharge": null,
    "vessel_name": null,
    "container_number": null
  },
  "notes": [],
  "confidence": "medium",
  "warnings": []
}`

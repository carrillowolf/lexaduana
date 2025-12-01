/**
 * Traducciones de códigos TARIC para alertas legibles
 * 
 * Fuente: EUR-Lex TARIC database
 * Última actualización: Noviembre 2025
 */

/**
 * Tipos de medida (Measure Type Codes)
 * Código numérico -> Descripción en español
 */
export const measureTypes = {
  // Aranceles
  103: { es: 'Arancel de terceros países', en: 'Third country duty', icon: '💰' },
  105: { es: 'Arancel no preferencial (destino especial)', en: 'Non preferential duty under end-use', icon: '💰' },
  112: { es: 'Suspensión arancelaria autónoma', en: 'Autonomous tariff suspension', icon: '✅' },
  115: { es: 'Suspensión autónoma (destino especial)', en: 'Autonomous suspension under end-use', icon: '✅' },
  117: { es: 'Suspensión para buques y plataformas', en: 'Suspension for ships and platforms', icon: '🚢' },
  122: { es: 'Contingente arancelario no preferencial', en: 'Non preferential tariff quota', icon: '📊' },
  123: { es: 'Contingente no preferencial (destino especial)', en: 'Non preferential tariff quota under end-use', icon: '📊' },
  
  // Preferencias
  142: { es: 'Preferencia arancelaria', en: 'Tariff preference', icon: '⭐' },
  143: { es: 'Contingente arancelario preferencial', en: 'Preferential tariff quota', icon: '⭐' },
  145: { es: 'Preferencia (destino especial)', en: 'Preference under end-use', icon: '⭐' },
  146: { es: 'Preferencia arancelaria sujeta a certificado', en: 'Tariff preference subject to certificate', icon: '⭐' },
  
  // Prohibiciones y restricciones
  277: { es: 'Prohibición de importación', en: 'Import prohibition', icon: '🚫' },
  465: { es: 'Restricción de despacho a libre práctica', en: 'Restriction on entry into free circulation', icon: '⚠️' },
  481: { es: 'Declaración sujeta a restricciones', en: 'Declaration subject to restrictions', icon: '⚠️' },
  
  // Controles sanitarios/fitosanitarios
  410: { es: 'Control veterinario', en: 'Veterinary control', icon: '🏥' },
  415: { es: 'Control fitosanitario', en: 'Official control - plants', icon: '🌱' },
  
  // Destino especial
  464: { es: 'Destino especial (declaración)', en: 'End-use declaration', icon: '📋' },
  
  // Valor en aduana
  490: { es: 'Valor de importación a tanto alzado', en: 'Standard import value', icon: '📈' },
  
  // Derechos antidumping
  552: { es: 'Derecho antidumping definitivo', en: 'Definitive anti-dumping duty', icon: '⚖️' },
  554: { es: 'Derecho compensatorio definitivo', en: 'Definitive countervailing duty', icon: '⚖️' },
  566: { es: 'Estadística antidumping/compensatorio', en: 'Anti-dumping/countervailing statistic', icon: '📊' },
  
  // Derechos adicionales / Sanciones
  695: { es: 'Derechos adicionales (sanciones)', en: 'Additional duties', icon: '🚫' },
  696: { es: 'Derechos adicionales (salvaguardia)', en: 'Additional duties (safeguard)', icon: '🛡️' },
  
  // Controles especiales
  705: { es: 'Prohibición - bienes para tortura', en: 'Import prohibition - torture goods', icon: '🚫' },
  706: { es: 'Prohibición exportación - tortura', en: 'Export prohibition - torture goods', icon: '🚫' },
  707: { es: 'Control de importación', en: 'Import control', icon: '🔍' },
  708: { es: 'Restricción exportación - tortura', en: 'Export restriction - torture goods', icon: '⚠️' },
  713: { es: 'Control OGM (organismos modificados)', en: 'GMO control', icon: '🧬' },
  714: { es: 'Control de importación', en: 'Import control', icon: '🔍' },
  719: { es: 'Control pesca INDNR (ilegal)', en: 'IUU fishing control', icon: '🐟' },
  750: { es: 'Control productos ecológicos', en: 'Organic products control', icon: '🌿' },
  751: { es: 'Control exportación residuos', en: 'Waste export control', icon: '♻️' },
  763: { es: 'Control de importación', en: 'Import control', icon: '🔍' },
  775: { es: 'CBAM - Mecanismo Ajuste Carbono', en: 'Carbon Border Adjustment Mechanism', icon: '🌍' },
  780: { es: 'Control de exportación', en: 'Export control', icon: '📤' },
  781: { es: 'Control de exportación', en: 'Export control', icon: '📤' },
};

/**
 * Códigos de certificados/documentos
 * Código alfanumérico -> Descripción en español
 * Incluye códigos UE y códigos nacionales AEAT
 */
export const certificates = {
  // === A - Autorizaciones ===
  A010: { es: 'Autorización de operador económico', en: 'Economic operator authorization', icon: '📜' },
  A014: { es: 'Autorización de importación', en: 'Import authorization', icon: '📜' },
  A015: { es: 'Autorización de exportación', en: 'Export authorization', icon: '📜' },
  A016: { es: 'Autorización específica', en: 'Specific authorization', icon: '📜' },
  A017: { es: 'Autorización de destino especial', en: 'End-use authorization', icon: '📜' },
  A022: { es: 'Autorización de simplificación', en: 'Simplification authorization', icon: '📜' },
  A023: { es: 'Autorización de depósito aduanero', en: 'Customs warehouse authorization', icon: '📜' },
  A030: { es: 'Autorización de expedidor autorizado', en: 'Authorized consignor authorization', icon: '📜' },
  
  // === C - Certificados ===
  C006: { es: 'Certificado de conformidad CE', en: 'CE conformity certificate', icon: '✅' },
  C008: { es: 'Certificado fitosanitario (importación)', en: 'Phytosanitary certificate (import)', icon: '🌱' },
  C013: { es: 'Documento de captura (pesca)', en: 'Catch certificate', icon: '🐟' },
  C014: { es: 'Declaración de captura simplificada', en: 'Simplified catch declaration', icon: '🐟' },
  C015: { es: 'Certificado de transformación (pesca)', en: 'Processing certificate', icon: '🐟' },
  C017: { es: 'Documento de tránsito (pesca)', en: 'Transit document (fishery)', icon: '🐟' },
  C018: { es: 'Certificado de reexportación (pesca)', en: 'Re-export certificate (fishery)', icon: '🐟' },
  C026: { es: 'Certificado ecológico UE', en: 'EU organic certificate', icon: '🌿' },
  C027: { es: 'Documento justificativo ecológico', en: 'Organic supporting document', icon: '🌿' },
  C046: { es: 'Certificado de exportación', en: 'Export certificate', icon: '📤' },
  C057: { es: 'Declaración conformidad - Opción A (Reg. UE 2016/879)', en: 'Declaration of conformity - Option A', icon: '✅' },
  C072: { es: 'Certificado de inspección', en: 'Inspection certificate', icon: '🔍' },
  C074: { es: 'Certificado fitosanitario', en: 'Phytosanitary certificate', icon: '🌱' },
  C075: { es: 'Certificado sanitario veterinario', en: 'Veterinary health certificate', icon: '🏥' },
  C078: { es: 'Certificado de origen EUR.1/EUR-MED', en: 'EUR.1/EUR-MED origin certificate', icon: '🌍' },
  C079: { es: 'Declaración conformidad - Opción B (Reg. UE 2016/879)', en: 'Declaration of conformity - Option B', icon: '✅' },
  C082: { es: 'Declaración conformidad - Opción C (Reg. UE 2016/879)', en: 'Declaration of conformity - Option C', icon: '✅' },
  C084: { es: 'Exención control veterinario', en: 'Veterinary control exemption', icon: '✅' },
  C085: { es: 'CHED-PP (Control fitosanitario)', en: 'CHED-PP (Plant health)', icon: '🌱' },
  C093: { es: 'Certificado de calidad', en: 'Quality certificate', icon: '✅' },
  C094: { es: 'Permiso CITES', en: 'CITES permit', icon: '🦁' },
  C095: { es: 'Certificado CITES de reexportación', en: 'CITES re-export certificate', icon: '🦁' },
  C098: { es: 'Notificación de importación CITES', en: 'CITES import notification', icon: '🦁' },
  C102: { es: 'Permiso de importación CITES', en: 'CITES import permit', icon: '🦁' },
  C103: { es: 'Certificado de origen CITES', en: 'CITES origin certificate', icon: '🦁' },
  C104: { es: 'Certificado de exposición itinerante', en: 'Travelling exhibition certificate', icon: '🎨' },
  C119: { es: 'Certificado de control de calidad', en: 'Quality control certificate', icon: '✅' },
  C400: { es: 'Certificado CITES requerido', en: 'CITES certificate required', icon: '🦁' },
  C504: { es: 'CVA - Simplificación determinación valor en aduana', en: 'CVA - Customs value simplification', icon: '💰' },
  C620: { es: 'Documento T2LF', en: 'T2LF Document', icon: '📄' },
  C631: { es: 'Carta oficial validación materiales no madera/reciclados', en: 'Official letter - non-wood/recycled materials', icon: '📄' },
  C640: { es: 'CHED-A (Control veterinario animales)', en: 'CHED-A (Animal health)', icon: '🏥' },
  C644: { es: 'Certificado control productos ecológicos', en: 'Organic products control certificate', icon: '🌿' },
  C646: { es: 'NOA - Notificación de llegada', en: 'NOA - Notification of Arrival', icon: '📋' },
  C651: { es: 'e-AD Documento Administrativo Electrónico (IIEE)', en: 'e-AD Electronic Administrative Document', icon: '📄' },
  C678: { es: 'Certificado en extinción', en: 'Certificate being phased out', icon: '⚠️' },
  C690: { es: 'Licencia FLEGT (madera legal)', en: 'FLEGT licence (legal timber)', icon: '🌲' },
  C990: { es: 'Sin certificado requerido (exento)', en: 'No certificate required (exempt)', icon: '✅' },
  
  // === D - Documentos ===
  D019: { es: 'Documento de vigilancia', en: 'Surveillance document', icon: '👁️' },
  
  // === E - Documentos electrónicos ===
  E017: { es: 'Documento SOIVRE (control calidad)', en: 'SOIVRE document (quality control)', icon: '🔬' },
  
  // === L - Licencias ===
  L001: { es: 'AGRIM - Licencia de importación agrícola', en: 'AGRIM - Agricultural import licence', icon: '🌾' },
  L049: { es: 'Licencia de importación L049', en: 'Import licence L049', icon: '📄' },
  L050: { es: 'Licencia de importación L050', en: 'Import licence L050', icon: '📄' },
  L065: { es: 'Licencia de importación L065', en: 'Import licence L065', icon: '📄' },
  L081: { es: 'Licencia de importación (acero)', en: 'Import licence (steel)', icon: '🔩' },
  L082: { es: 'Licencia de importación (aluminio)', en: 'Import licence (aluminium)', icon: '🔩' },
  L100: { es: 'Licencia importación sustancias ozono (Comisión)', en: 'Ozone substances import licence', icon: '🌍' },
  L135: { es: 'Autorización importación precursores', en: 'Precursors import authorization', icon: '⚗️' },
  L139: { es: 'Licencia de exportación', en: 'Export licence', icon: '📄' },
  L142: { es: 'Licencia de importación (textil)', en: 'Import licence (textile)', icon: '👕' },
  L143: { es: 'Licencia de importación agrícola', en: 'Agricultural import licence', icon: '🌾' },
  
  // === N - Declaraciones/Documentos nacionales ===
  N003: { es: 'Control de calidad SOIVRE', en: 'SOIVRE quality control', icon: '🔬' },
  N337: { es: 'Declaración depósito temporal (doc. previo)', en: 'Temporary storage declaration', icon: '📋' },
  N830: { es: 'Declaración de mercancías para exportación', en: 'Export goods declaration', icon: '📤' },
  N851: { es: 'CHED-PP Canarias', en: 'CHED-PP Canary Islands', icon: '🌱' },
  N853: { es: 'CHED-P (Productos origen vegetal)', en: 'CHED-P (Plant products)', icon: '🌱' },
  N864: { es: 'Declaración de conocimiento del origen', en: 'Statement on origin', icon: '📝' },
  N954: { es: 'No se aplican restricciones', en: 'No restrictions apply', icon: '✅' },
  N955: { es: 'Documento N955', en: 'Document N955', icon: '📄' },
  N990: { es: 'Sin documentos adicionales', en: 'No additional documents', icon: '✅' },
  
  // === U - Licencias/Permisos especiales ===
  U004: { es: 'Autorización de uso final', en: 'End-use authorization', icon: '📋' },
  U005: { es: 'Declaración de uso final', en: 'End-use declaration', icon: '📋' },
  U059: { es: 'Certificado de uso final militar', en: 'Military end-use certificate', icon: '🎖️' },
  U062: { es: 'Documento de vigilancia previa', en: 'Prior surveillance document', icon: '👁️' },
  U067: { es: 'Licencia doble uso', en: 'Dual-use licence', icon: '⚠️' },
  U068: { es: 'Licencia de exportación armas', en: 'Arms export licence', icon: '⚠️' },
  U069: { es: 'Autorización global exportación', en: 'Global export authorization', icon: '🌐' },
  U071: { es: 'Certificado de importación (armas)', en: 'Import certificate (arms)', icon: '⚠️' },
  U074: { es: 'Autorización específica de exportación', en: 'Specific export authorization', icon: '📤' },
  U084: { es: 'Licencia de importación textil', en: 'Textile import licence', icon: '👕' },
  U088: { es: 'Licencia de importación obligatoria', en: 'Mandatory import licence', icon: '📄' },
  U090: { es: 'Certificado de importación armas', en: 'Arms import certificate', icon: '⚠️' },
  U091: { es: 'Autorización de intermediación', en: 'Brokering authorization', icon: '🤝' },
  U099: { es: 'Licencia de exportación acero', en: 'Steel export licence', icon: '🔩' },
  U119: { es: 'Licencia general de exportación UE', en: 'EU general export licence', icon: '🇪🇺' },
  U120: { es: 'Licencia general nacional', en: 'National general licence', icon: '📄' },
  U121: { es: 'Autorización individual exportación', en: 'Individual export authorization', icon: '📤' },
  U177: { es: 'Autorización de operador registrado', en: 'Registered operator authorization', icon: '📋' },
  U178: { es: 'Número EORI del importador', en: 'Importer EORI number', icon: '🔢' },
  
  // === Y - Declaraciones y exenciones ===
  Y001: { es: 'Mercancía exenta de restricciones', en: 'Goods exempt from restrictions', icon: '✅' },
  Y003: { es: 'Mercancía sin componentes prohibidos', en: 'Goods without prohibited components', icon: '✅' },
  Y006: { es: 'Certificado de no manipulación', en: 'Non-manipulation certificate', icon: '📝' },
  Y007: { es: 'País de último envío conocido', en: 'Country of last shipment', icon: '🚢' },
  Y008: { es: 'Referencia a autorización aduanera', en: 'Customs authorization reference', icon: '📋' },
  Y017: { es: 'Referencia de régimen especial', en: 'Special procedure reference', icon: '📋' },
  Y019: { es: 'Declaración simplificada DUA', en: 'Simplified DUA declaration', icon: '📝' },
  Y020: { es: 'Código adicional TARIC', en: 'TARIC additional code', icon: '🔢' },
  Y021: { es: 'Sin código adicional', en: 'No additional code', icon: '✅' },
  Y043: { es: 'Verificación fitosanitaria G043', en: 'Phytosanitary verification G043', icon: '🌱' },
  Y057: { es: 'Exención licencia FLEGT (madera)', en: 'FLEGT licence exemption', icon: '🌲' },
  Y058: { es: 'Exención 410 pesos pequeños (TARIC)', en: 'Veterinary exemption - small weights', icon: '✅' },
  Y063: { es: 'Exención 410 para China', en: 'Veterinary exemption - China', icon: '✅' },
  Y070: { es: 'Exención FLEGT (art. 4.3 Reg. CE 2173/2005)', en: 'FLEGT exemption art. 4.3', icon: '🌲' },
  Y072: { es: 'Bienes UE de regreso de Andorra', en: 'EU goods returning from Andorra', icon: '🔄' },
  Y073: { es: 'Bienes UE de regreso de Suiza', en: 'EU goods returning from Switzerland', icon: '🔄' },
  Y074: { es: 'Bienes UE de regreso de Islas Feroe', en: 'EU goods returning from Faroe Islands', icon: '🔄' },
  Y075: { es: 'Bienes UE de regreso de Groenlandia', en: 'EU goods returning from Greenland', icon: '🔄' },
  Y076: { es: 'Bienes UE de regreso de Islandia', en: 'EU goods returning from Iceland', icon: '🔄' },
  Y077: { es: 'Bienes UE de regreso de Liechtenstein', en: 'EU goods returning from Liechtenstein', icon: '🔄' },
  Y078: { es: 'Bienes UE de regreso de Noruega', en: 'EU goods returning from Norway', icon: '🔄' },
  Y079: { es: 'Bienes UE de regreso de San Marino', en: 'EU goods returning from San Marino', icon: '🔄' },
  Y085: { es: 'Mercancía exenta control calidad', en: 'Goods exempt from quality control', icon: '✅' },
  Y086: { es: 'Mercancía UE (no terceros países)', en: 'EU goods (not third country)', icon: '🇪🇺' },
  Y087: { es: 'Mercancía no sujeta a control', en: 'Goods not subject to control', icon: '✅' },
  Y088: { es: 'Producto no OGM', en: 'Non-GMO product', icon: '🌿' },
  Y089: { es: 'Producto ecológico certificado', en: 'Certified organic product', icon: '🌿' },
  Y090: { es: 'No sujeto a control ecológico', en: 'Not subject to organic control', icon: '✅' },
  Y091: { es: 'Exento control INDNR pesca', en: 'Exempt from IUU fishing control', icon: '🐟' },
  Y100: { es: 'Declaración de conformidad', en: 'Declaration of conformity', icon: '✅' },
  Y120: { es: 'Exención gases fluorados (<10t CO₂ eq/año)', en: 'F-gas exemption (<10t CO2 eq/year)', icon: '🌡️' },
  Y121: { es: 'Toneladas equivalentes CO₂ gases fluorados', en: 'F-gas CO2 equivalent tonnes', icon: '🌡️' },
  Y123: { es: 'Empresa registrada portal gases fluorados (Reg. UE 2024/573)', en: 'F-gas portal registered company', icon: '🌡️' },
  Y155: { es: 'Certificado de autenticidad', en: 'Certificate of authenticity', icon: '📜' },
  Y165: { es: 'Declaración especial de origen', en: 'Special origin declaration', icon: '🌍' },
  Y854: { es: 'Exención CHERNOBYL', en: 'Chernobyl exemption', icon: '☢️' },
  Y855: { es: 'Exención CHERNOBYL', en: 'Chernobyl exemption', icon: '☢️' },
  Y859: { es: 'Declaración en factura (origen)', en: 'Invoice declaration (origin)', icon: '📝' },
  Y864: { es: 'Declaración de origen en factura', en: 'Origin declaration on invoice', icon: '📝' },
  Y874: { es: 'Declaración REX (origen)', en: 'REX origin declaration', icon: '📝' },
  Y928: { es: 'Exención medida 722 para Japón', en: 'Measure 722 exemption - Japan', icon: '✅' },
  Y930: { es: 'Exención control veterinario 410', en: 'Veterinary control 410 exemption', icon: '✅' },
  Y931: { es: 'Exención control veterinario 410', en: 'Veterinary control 410 exemption', icon: '✅' },
  Y980: { es: 'Exención control veterinario 410', en: 'Veterinary control 410 exemption', icon: '✅' },
  Y999: { es: 'Otros documentos', en: 'Other documents', icon: '📄' },
  
  // === CÓDIGOS NACIONALES AEAT (1XXX) - Documentos España ===
  '1007': { es: 'Aceptación individual inclusión en depósito', en: 'Individual deposit inclusion acceptance', icon: '🏭' },
  '1019': { es: 'Cláusula cesión representación en portal', en: 'Portal representation assignment clause', icon: '📋' },
  '1055': { es: 'IPNR - Declaración responsable fabricante', en: 'IPNR - Manufacturer responsible declaration', icon: '📝' },
  '1101': { es: 'Autorización MDDU', en: 'MDDU Authorization', icon: '📜' },
  '1104': { es: 'MDDU - Modelo Datos Despacho Único', en: 'MDDU - Single Clearance Data Model', icon: '📋' },
  '1106': { es: 'Certificado REA (Registro Exportadores Autorizados)', en: 'REA Certificate', icon: '📜' },
  '1117': { es: 'MDDU', en: 'MDDU', icon: '📋' },
  '1118': { es: 'MDDU', en: 'MDDU', icon: '📋' },
  '1135': { es: 'Certificado de plástico reciclado', en: 'Recycled plastic certificate', icon: '♻️' },
  '1201': { es: 'DUA de importación', en: 'Import DUA', icon: '📄' },
  '1230': { es: 'Certificado RoHS (solo Z)', en: 'RoHS Certificate (Z only)', icon: '🔌' },
  '1231': { es: 'RoHS - Desglose expediente por mercancía en demora', en: 'RoHS - Deferred goods breakdown', icon: '🔌' },
  '1232': { es: 'RoHS - Error peso, no retirada control SOIVRE', en: 'RoHS - Weight error, not SOIVRE withdrawal', icon: '🔌' },
  '1233': { es: 'No conformidad parcial', en: 'Partial non-conformity', icon: '⚠️' },
  '1234': { es: 'Eco voluntario', en: 'Voluntary eco', icon: '🌿' },
  '1235': { es: 'PUE COM', en: 'PUE COM', icon: '📋' },
  '1236': { es: 'Calidad PUE', en: 'PUE Quality', icon: '✅' },
  '1306': { es: 'Control Farmacia', en: 'Pharmacy control', icon: '💊' },
  '1311': { es: 'Control Pesca', en: 'Fishery control', icon: '🐟' },
  '1315': { es: 'Exención SOIVRE', en: 'SOIVRE exemption', icon: '✅' },
  '1317': { es: 'Exención SOIVRE', en: 'SOIVRE exemption', icon: '✅' },
  '1318': { es: 'OEA - No procede cert. RD 993/2022 (producto no en anexo)', en: 'AEO - RD 993/2022 cert. not applicable', icon: '✅' },
  '1320': { es: 'OEA - Exención control sistemático RD 993/2022', en: 'AEO - RD 993/2022 systematic control exemption', icon: '✅' },
  '1403': { es: 'Exención Farmacia', en: 'Pharmacy exemption', icon: '💊' },
  '1404': { es: 'Exención Farmacia (Suiza/Andorra)', en: 'Pharmacy exemption (Switzerland/Andorra)', icon: '💊' },
  '1407': { es: 'No procede Farmacia', en: 'Pharmacy not applicable', icon: '💊' },
  '1412': { es: 'Exención VIM con remisión 02.362', en: 'VIM exemption ref. 02.362', icon: '✅' },
  '1413': { es: 'Exención SNM con remisión 02.363', en: 'SNM exemption ref. 02.363', icon: '✅' },
  '1414': { es: 'Exención fitosanitario', en: 'Phytosanitary exemption', icon: '🌱' },
  '1415': { es: 'Exención almendras FTN y TFT', en: 'Almonds FTN/TFT exemption', icon: '🥜' },
  '1417': { es: 'Remisión 02.608 a 2 medidas ROS', en: 'Ref. 02.608 to 2 ROS measures', icon: '📋' },
  '1425': { es: 'Exención 410 si casilla 37.1 formato XX51', en: '410 exemption if box 37.1 format XX51', icon: '✅' },
  '1426': { es: 'Exención MBI', en: 'MBI exemption', icon: '✅' },
  '1427': { es: 'Exención MBI 2', en: 'MBI exemption 2', icon: '✅' },
  '1501': { es: 'Destino Final - Suspensión derechos Canarias (Reg. UE 2021/2048)', en: 'End-use - Canary Islands duty suspension', icon: '🏝️' },
  '1502': { es: 'Destino Final - Suspensión derechos tabaco Canarias', en: 'End-use - Canary Islands tobacco duty suspension', icon: '🚬' },
  '1503': { es: 'Destino Final - Suspensión derechos armas/equipos militares', en: 'End-use - Military arms/equipment duty suspension', icon: '🎖️' },
  '1507': { es: 'Autorización perfeccionamiento activo fiscal (ESIPOF)', en: 'Fiscal inward processing authorization', icon: '🏭' },
  '1508': { es: 'Autorización perfeccionamiento pasivo fiscal (ESOPOF)', en: 'Fiscal outward processing authorization', icon: '🏭' },
  '1509': { es: 'Autorización importación temporal fiscal (ESTEAF)', en: 'Fiscal temporary admission authorization', icon: '🏭' },
  
  // === CÓDIGOS NACIONALES AEAT (5XXX) - Códigos de actividad ===
  '5004': { es: 'Código de actividad y establecimiento', en: 'Activity and establishment code', icon: '🏢' },
  '5014': { es: 'CAF - Código Actividad Gases Fluorados', en: 'F-gas activity code', icon: '🌡️' },
  '5015': { es: 'Número CAS (Chemical Abstracts Service)', en: 'CAS number', icon: '⚗️' },
  '5016': { es: 'CAE expedidor registrado para e-DA', en: 'Registered consignor CAE for e-AD', icon: '📋' },
  '5018': { es: 'Ubicación almacén - Autorización Depósito', en: 'Warehouse location - Deposit authorization', icon: '🏭' },
  '5025': { es: 'CAF Almacenista Gases Fluorados', en: 'F-gas warehouseman CAF', icon: '🌡️' },
  '5026': { es: 'CAF Importador Gases Fluorados', en: 'F-gas importer CAF', icon: '🌡️' },
  '5027': { es: 'IGF - NIF Representante importador no establecido', en: 'F-gas - Non-established importer representative NIF', icon: '🌡️' },
  
  // === CÓDIGOS NACIONALES AEAT (7XXX) - Valores e importes ===
  '7002': { es: 'Gastos IVA', en: 'VAT expenses', icon: '💰' },
  '7003': { es: 'Importe Subvención REA (base IGIC)', en: 'REA subsidy amount (IGIC base)', icon: '💰' },
  '7007': { es: 'Código 7007', en: 'Code 7007', icon: '📋' },
  '7009': { es: 'Valor estadístico - Perfeccionamiento Pasivo', en: 'Statistical value - Outward processing', icon: '📊' },
  '7011': { es: 'Cantidad mercancía vinculada DA (art. 86.1/2 CAU)', en: 'Goods quantity linked to DA (art. 86.1/2 UCC)', icon: '📦' },
  '7015': { es: 'Potencia en KW (Impuesto Gases Fluorados)', en: 'Power in KW (F-gas tax)', icon: '⚡' },
  '7016': { es: 'H1 - Vinculación régimen especial', en: 'H1 - Special procedure link', icon: '📋' },
  '7017': { es: 'H1 - Ultimación régimen especial', en: 'H1 - Special procedure discharge', icon: '📋' },
  '7018': { es: 'H1 - Importe a garantizar (decl. simplificada B)', en: 'H1 - Amount to guarantee (simplified decl. B)', icon: '💰' },
  '7020': { es: 'Masa neta cuando España PCI y régimen 53/71', en: 'Net mass when Spain PCI and procedure 53/71', icon: '⚖️' },
  '7021': { es: 'Identificador matriz transformación Regímenes Especiales', en: 'Special procedures transformation matrix ID', icon: '🏭' },
  '7022': { es: 'Coeficiente transformación Regímenes Especiales', en: 'Special procedures transformation coefficient', icon: '🏭' },
  
  // === CÓDIGOS NACIONALES AEAT (8XXX) - Tabaco ===
  '8001': { es: 'Código actividad y establecimiento - Labores Tabaco', en: 'Activity code - Tobacco products', icon: '🚬' },
  
  // === CÓDIGOS NACIONALES AEAT (9XXX) - Varios ===
  '9001': { es: 'Datado bulto en partida DDT con varias declaraciones', en: 'Package dating in DDT with multiple declarations', icon: '📦' },
  '9020': { es: 'Solicitud aceptación copia digital EUR.1/EUR-MED', en: 'Digital EUR.1/EUR-MED copy acceptance request', icon: '🌍' },
  '9022': { es: 'Reducción 100% - Régimen potencial RR.EE. 44 51 53', en: '100% reduction - Special procedures 44 51 53', icon: '✅' },
  '9023': { es: 'Código postal origen Israel', en: 'Israel origin postal code', icon: '📮' },
  '9024': { es: 'Localidad origen Israel', en: 'Israel origin locality', icon: '📍' },
  '9EQV': { es: 'Documento previo 9EQV', en: '9EQV previous document', icon: '📄' },
  '9EZF': { es: 'Documento previo - Entrada zona franca', en: 'Previous document - Free zone entry', icon: '🏭' },
  '9IRR': { es: 'Documento previo - Entrada irregular', en: 'Previous document - Irregular entry', icon: '⚠️' },
  '9NDD': { es: 'Recintos sin DDT obligatoria', en: 'Premises without mandatory DDT', icon: '🏭' },
  '9ZZZ': { es: 'Documento previo 9ZZZ', en: '9ZZZ previous document', icon: '📄' },
};

/**
 * Grupos geográficos / Códigos de origen
 * Código numérico -> Descripción en español
 */
export const geographicalAreas = {
  1008: { es: 'Todos los terceros países', en: 'All third countries', icon: '🌍' },
  1011: { es: 'ERGA OMNES (todos los países)', en: 'ERGA OMNES (all countries)', icon: '🌍' },
  1033: { es: 'CARIFORUM (Caribe)', en: 'CARIFORUM (Caribbean)', icon: '🏝️' },
  2005: { es: 'SGP-EBA (países menos desarrollados)', en: 'GSP-EBA (least developed)', icon: '🤝' },
  2012: { es: 'Espacio Económico Europeo', en: 'European Economic Area', icon: '🇪🇺' },
  2020: { es: 'SGP - Régimen general', en: 'GSP - General arrangements', icon: '🤝' },
  2027: { es: 'SGP+ (desarrollo sostenible)', en: 'GSP+ (sustainable development)', icon: '🌱' },
  2200: { es: 'América Central', en: 'Central America', icon: '🌎' },
  2500: { es: 'Países miembros OMC', en: 'WTO member countries', icon: '🏛️' },
  2501: { es: 'Países no miembros OMC', en: 'Non-WTO members', icon: '🏛️' },
  4007: { es: 'Fitosanitario G043 (CA, US, VN)', en: 'Phytosanitary G043 (CA, US, VN)', icon: '🌱' },
  5005: { es: 'Países sujetos a salvaguardia', en: 'Countries subject to safeguard', icon: '🛡️' },
};

/**
 * Prioridades de alerta por tipo de medida
 */
export const measurePriority = {
  // Crítico - Prohibiciones y sanciones
  277: 1, // Import prohibition
  695: 1, // Additional duties (sanctions)
  705: 1, // Torture goods prohibition
  706: 1, // Torture export prohibition
  
  // Alto - Controles obligatorios
  410: 2, // Veterinary control
  415: 2, // Phytosanitary control
  552: 2, // Anti-dumping
  554: 2, // Countervailing duty
  707: 2, // Import control
  719: 2, // IUU fishing
  775: 2, // CBAM
  
  // Medio - Licencias y autorizaciones
  143: 3, // Preferential quota
  122: 3, // Non-preferential quota
  750: 3, // Organic control
  713: 3, // GMO control
  
  // Informativo
  142: 4, // Tariff preference
  112: 4, // Suspension
  490: 4, // Standard import value
};

/**
 * Traduce un código de tipo de medida
 * @param {number|string} code - Código de tipo de medida
 * @param {string} lang - Idioma ('es' o 'en')
 * @returns {object} {text, icon}
 */
export function translateMeasureType(code, lang = 'es') {
  const numCode = parseInt(code);
  const measure = measureTypes[numCode];
  
  if (measure) {
    return {
      text: measure[lang] || measure.es,
      icon: measure.icon,
      code: numCode
    };
  }
  
  return {
    text: `Medida tipo ${code}`,
    icon: '📋',
    code: numCode
  };
}

/**
 * Traduce un código de certificado
 * @param {string} code - Código de certificado (ej: 'C074', 'E017')
 * @param {string} lang - Idioma ('es' o 'en')
 * @returns {object} {text, icon}
 */
export function translateCertificate(code, lang = 'es') {
  const cert = certificates[code];
  
  if (cert) {
    return {
      text: cert[lang] || cert.es,
      icon: cert.icon,
      code: code
    };
  }
  
  // Intentar deducir por prefijo
  const prefix = code?.charAt(0);
  const prefixDescriptions = {
    'A': 'Autorización',
    'C': 'Certificado',
    'D': 'Documento',
    'E': 'Documento electrónico',
    'L': 'Licencia',
    'N': 'Documento nacional',
    'U': 'Licencia/Permiso',
    'Y': 'Declaración'
  };
  
  return {
    text: `${prefixDescriptions[prefix] || 'Documento'} ${code}`,
    icon: '📄',
    code: code
  };
}

/**
 * Traduce un código de área geográfica
 * @param {number|string} code - Código de área geográfica
 * @param {string} lang - Idioma ('es' o 'en')
 * @returns {object} {text, icon}
 */
export function translateGeographicalArea(code, lang = 'es') {
  // Si es un código de país ISO de 2 letras, devolverlo tal cual
  if (typeof code === 'string' && code.length === 2 && /^[A-Z]{2}$/.test(code)) {
    return {
      text: `País: ${code}`,
      icon: '🏳️',
      code: code
    };
  }
  
  const numCode = parseInt(code);
  const area = geographicalAreas[numCode];
  
  if (area) {
    return {
      text: area[lang] || area.es,
      icon: area.icon,
      code: numCode
    };
  }
  
  return {
    text: `Grupo ${code}`,
    icon: '🌍',
    code: numCode
  };
}

/**
 * Formatea una alerta completa de forma legible
 * @param {object} alert - Objeto de alerta con measure_code, certificate, origin_code
 * @param {string} lang - Idioma
 * @returns {object} Alerta formateada
 */
export function formatAlert(alert, lang = 'es') {
  const measure = translateMeasureType(alert.measure_code || alert.measureCode, lang);
  const cert = alert.certificate ? translateCertificate(alert.certificate, lang) : null;
  const origin = alert.origin_code ? translateGeographicalArea(alert.origin_code, lang) : null;
  
  // Determinar prioridad
  const priority = measurePriority[parseInt(alert.measure_code || alert.measureCode)] || 4;
  
  // Construir texto legible
  let description = measure.text;
  if (cert && cert.code !== 'N990') {
    description += ` - ${cert.text}`;
  }
  
  return {
    icon: measure.icon,
    title: measure.text,
    certificate: cert,
    origin: origin,
    description: description,
    priority: priority,
    originalCode: {
      measure: alert.measure_code || alert.measureCode,
      certificate: alert.certificate,
      origin: alert.origin_code
    }
  };
}

/**
 * Obtiene el color de prioridad para una alerta
 * @param {number} priority - Nivel de prioridad (1-4)
 * @returns {object} Colores para UI
 */
export function getPriorityColors(priority) {
  const colors = {
    1: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', label: 'Crítico' },
    2: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', label: 'Importante' },
    3: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', label: 'Atención' },
    4: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', label: 'Informativo' },
  };
  
  return colors[priority] || colors[4];
}

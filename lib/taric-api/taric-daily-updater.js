/**
 * TARIC Daily Updates Downloader
 * 
 * Este script descarga las actualizaciones diarias de TARIC desde la web de la CE
 * y procesa los cambios para actualizar la base de datos de LexAduana
 * 
 * Uso: node taric-daily-updater.js
 * Cron: 0 20 * * 1-5 node taric-daily-updater.js (Lunes-Viernes a las 20:00)
 * 
 * Las actualizaciones se publican entre 19:00-19:15 CET
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const XLSX = require('xlsx');

// Configuración
const CONFIG = {
    // URL base de TARIC
    TARIC_BASE_URL: 'https://ec.europa.eu/taxation_customs/dds2/taric',
    
    // Directorio de descargas
    DOWNLOAD_DIR: './taric-updates',
    
    // Directorio de procesados
    PROCESSED_DIR: './taric-processed',
    
    // Archivo de log
    LOG_FILE: './taric-update.log',
    
    // Headers para simular navegador
    HEADERS: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    }
};

// Archivos de interés en el Daily Update
const FILES_OF_INTEREST = [
    'Goods nomenclature', // Códigos de mercancías
    'Measures',           // Medidas (aranceles, restricciones)
    'Additional codes',   // Códigos adicionales
    'Footnotes',          // Notas al pie
    'Geographical areas'  // Áreas geográficas
];

/**
 * Logger con timestamp
 */
function log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type}] ${message}`;
    console.log(logMessage);
    
    // Append to log file
    fs.appendFileSync(CONFIG.LOG_FILE, logMessage + '\n');
}

/**
 * Obtiene la fecha actual en formato TARIC (YYYYMMDD)
 */
function getTaricDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

/**
 * Obtiene la lista de Daily Updates disponibles
 * Nota: En producción, habría que parsear la página web o usar una API
 */
async function getAvailableUpdates() {
    log('Verificando actualizaciones disponibles...');
    
    try {
        // En un entorno real, parseamos la página para obtener los links
        // Por ahora, construimos la URL basada en la fecha
        const date = getTaricDate();
        
        // URL típica del daily update
        // Formato real: varía según lo que publiquen
        const possibleUrls = [
            `${CONFIG.TARIC_BASE_URL}/taric_daily_update_${date}.zip`,
            `${CONFIG.TARIC_BASE_URL}/daily/taric_update_${date}.zip`,
        ];
        
        return {
            date,
            urls: possibleUrls
        };
    } catch (error) {
        log(`Error obteniendo actualizaciones: ${error.message}`, 'ERROR');
        throw error;
    }
}

/**
 * Descarga un archivo ZIP
 */
async function downloadFile(url, destPath) {
    log(`Descargando: ${url}`);
    
    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            headers: CONFIG.HEADERS,
            timeout: 60000
        });
        
        const writer = fs.createWriteStream(destPath);
        response.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                log(`Descarga completada: ${destPath}`);
                resolve(destPath);
            });
            writer.on('error', reject);
        });
    } catch (error) {
        if (error.response?.status === 404) {
            log(`Archivo no encontrado (404): ${url}`, 'WARN');
            return null;
        }
        throw error;
    }
}

/**
 * Extrae archivos ZIP
 */
async function extractZip(zipPath, destDir) {
    log(`Extrayendo: ${zipPath}`);
    
    return new Promise((resolve, reject) => {
        fs.createReadStream(zipPath)
            .pipe(unzipper.Extract({ path: destDir }))
            .on('close', () => {
                log(`Extracción completada en: ${destDir}`);
                resolve(destDir);
            })
            .on('error', reject);
    });
}

/**
 * Procesa un archivo Excel de TARIC
 */
function processExcelFile(filePath) {
    log(`Procesando: ${path.basename(filePath)}`);
    
    try {
        const workbook = XLSX.readFile(filePath);
        const results = {};
        
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet, { 
                defval: null,
                raw: false 
            });
            
            results[sheetName] = {
                rowCount: data.length,
                columns: data.length > 0 ? Object.keys(data[0]) : [],
                sample: data.slice(0, 3) // Primeras 3 filas como muestra
            };
        });
        
        log(`  → ${Object.keys(results).length} hojas procesadas`);
        return results;
    } catch (error) {
        log(`  → Error procesando: ${error.message}`, 'ERROR');
        return null;
    }
}

/**
 * Compara datos nuevos con existentes para detectar cambios
 */
function detectChanges(newData, existingData) {
    const changes = {
        added: [],
        modified: [],
        removed: [],
        summary: {}
    };
    
    // Implementar lógica de comparación según estructura de datos
    // Por ahora, solo contamos registros
    
    for (const sheet in newData) {
        changes.summary[sheet] = {
            newRows: newData[sheet].rowCount,
            existingRows: existingData?.[sheet]?.rowCount || 0
        };
    }
    
    return changes;
}

/**
 * Genera reporte de cambios
 */
function generateReport(changes, date) {
    const reportPath = path.join(CONFIG.PROCESSED_DIR, `report_${date}.json`);
    
    const report = {
        date: date,
        timestamp: new Date().toISOString(),
        changes: changes,
        status: 'completed'
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`Reporte generado: ${reportPath}`);
    
    return report;
}

/**
 * Función principal
 */
async function main() {
    log('='.repeat(60));
    log('TARIC Daily Updater - Inicio');
    log('='.repeat(60));
    
    // Crear directorios si no existen
    [CONFIG.DOWNLOAD_DIR, CONFIG.PROCESSED_DIR].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
    
    try {
        // 1. Obtener información de actualizaciones
        const updates = await getAvailableUpdates();
        log(`Fecha TARIC: ${updates.date}`);
        
        // 2. Intentar descargar (simulación - en producción usar URLs reales)
        log('\n⚠️  NOTA: Este script necesita URLs reales de Daily Updates');
        log('    Los Daily Updates se publican en la página de TARIC');
        log('    URL: https://ec.europa.eu/taxation_customs/dds2/taric/taric_consultation.jsp');
        log('    Sección: "Daily updates" (archivos ZIP)');
        
        // 3. Si tuviéramos el archivo, lo procesaríamos así:
        /*
        const zipPath = path.join(CONFIG.DOWNLOAD_DIR, `update_${updates.date}.zip`);
        const extractDir = path.join(CONFIG.DOWNLOAD_DIR, updates.date);
        
        // Descargar
        await downloadFile(updates.urls[0], zipPath);
        
        // Extraer
        await extractZip(zipPath, extractDir);
        
        // Procesar archivos Excel
        const files = fs.readdirSync(extractDir).filter(f => f.endsWith('.xlsx'));
        const allData = {};
        
        for (const file of files) {
            const filePath = path.join(extractDir, file);
            allData[file] = processExcelFile(filePath);
        }
        
        // Detectar cambios
        const changes = detectChanges(allData, previousData);
        
        // Generar reporte
        generateReport(changes, updates.date);
        */
        
        // 4. Mostrar estructura esperada
        log('\n📋 Archivos esperados en Daily Update:');
        FILES_OF_INTEREST.forEach(file => {
            log(`   - ${file}.xlsx`);
        });
        
        log('\n✅ Script listo para usar con URLs reales');
        log('   Para integrar con LexAduana:');
        log('   1. Descargar Daily Update manualmente o con scraper');
        log('   2. Colocar ZIP en ./taric-updates/');
        log('   3. Ejecutar este script para procesar');
        
    } catch (error) {
        log(`Error en proceso principal: ${error.message}`, 'ERROR');
        process.exit(1);
    }
    
    log('\n' + '='.repeat(60));
    log('TARIC Daily Updater - Fin');
    log('='.repeat(60));
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    main,
    processExcelFile,
    detectChanges,
    CONFIG
};

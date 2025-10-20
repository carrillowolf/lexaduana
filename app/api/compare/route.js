import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { hsCode, cifValue, countryCodes } = body;

        if (!hsCode || !cifValue || !countryCodes || !Array.isArray(countryCodes)) {
            return NextResponse.json(
                { error: 'Parámetros inválidos' },
                { status: 400 }
            );
        }

        if (countryCodes.length > 5) {
            return NextResponse.json(
                { error: 'Máximo 5 países permitidos' },
                { status: 400 }
            );
        }

        const results = [];
        const parsedCifValue = parseFloat(cifValue);

        console.log('=== INICIANDO COMPARACIÓN MULTI-ORIGEN ===');
        console.log('HS Code:', hsCode);
        console.log('CIF Value:', parsedCifValue);
        console.log('Países:', countryCodes);

        // Llamar a la API de cálculo existente para cada país
        for (const countryCode of countryCodes) {
            console.log(`\n--- Calculando para país: ${countryCode} ---`);

            try {
                // Usar la API existente que ya tiene toda la lógica correcta
                const calcResponse = await fetch(`${request.nextUrl.origin}/api/calculate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        hsCode,
                        cifValue: parsedCifValue,
                        countryCode
                    })
                });

                const calcData = await calcResponse.json();

                if (!calcResponse.ok || !calcData.success) {
                    console.error(`Error calculando ${countryCode}:`, calcData.error);
                    results.push({
                        countryCode,
                        countryName: countryCode,
                        error: calcData.error || 'Error en el cálculo'
                    });
                    continue;
                }

                const data = calcData.data;

                console.log(`✓ ${data.country.name}: Arancel ${data.duty.appliedRate}% = €${data.duty.amount}`);

                // Si hay arancel preferencial Y es diferente al estándar, mostrar AMBAS opciones
                const hasPreferential = data.duty.appliedRate < data.duty.standardRate;

                if (hasPreferential) {
                    // OPCIÓN 1: CON preferencial (lo que se mostró en el cálculo)
                    results.push({
                        countryCode,
                        countryName: data.country.name,
                        hasAgreement: true,
                        agreementInfo: data.country.agreement || 'Acuerdo comercial',
                        dutyType: 'preferential',
                        dutyRate: data.duty.appliedRate,
                        dutyAmount: parseFloat(data.duty.amount.toFixed(2)),
                        standardRate: data.duty.standardRate,
                        vatRate: data.vat.rate,
                        vatType: data.vat.type,
                        vatAmount: parseFloat(data.vat.amount.toFixed(2)),
                        totalCost: parseFloat(data.total.toFixed(2)),
                        savings: 0,
                        description: data.description,
                        requiresCertificate: true,
                        isPreferentialOption: true
                    });

                    // OPCIÓN 2: SIN preferencial (arancel estándar)
                    const standardDutyAmount = (parsedCifValue * data.duty.standardRate) / 100;
                    const standardTaxableBase = parsedCifValue + standardDutyAmount;
                    const standardVatAmount = (standardTaxableBase * data.vat.rate) / 100;
                    const standardTotal = parsedCifValue + standardDutyAmount + standardVatAmount;

                    results.push({
                        countryCode,
                        countryName: data.country.name,
                        hasAgreement: false,
                        agreementInfo: null,
                        dutyType: 'erga_omnes',
                        dutyRate: data.duty.standardRate,
                        dutyAmount: parseFloat(standardDutyAmount.toFixed(2)),
                        standardRate: data.duty.standardRate,
                        vatRate: data.vat.rate,
                        vatType: data.vat.type,
                        vatAmount: parseFloat(standardVatAmount.toFixed(2)),
                        totalCost: parseFloat(standardTotal.toFixed(2)),
                        savings: 0,
                        description: data.description,
                        requiresCertificate: false,
                        isPreferentialOption: false
                    });
                } else {
                    // NO hay preferencial, solo una opción
                    results.push({
                        countryCode,
                        countryName: data.country.name,
                        hasAgreement: data.country.agreement ? true : false,
                        agreementInfo: data.country.agreement || null,
                        dutyType: 'erga_omnes',
                        dutyRate: data.duty.appliedRate,
                        dutyAmount: parseFloat(data.duty.amount.toFixed(2)),
                        standardRate: data.duty.standardRate,
                        vatRate: data.vat.rate,
                        vatType: data.vat.type,
                        vatAmount: parseFloat(data.vat.amount.toFixed(2)),
                        totalCost: parseFloat(data.total.toFixed(2)),
                        savings: 0,
                        description: data.description,
                        requiresCertificate: false,
                        isPreferentialOption: false
                    });
                }

            } catch (error) {
                console.error(`Error procesando ${countryCode}:`, error);
                results.push({
                    countryCode,
                    error: 'Error al procesar el cálculo'
                });
            }
        }

        // Calcular ahorros respecto al más caro
        if (results.length > 0) {
            const validResults = results.filter(r => !r.error);

            if (validResults.length > 0) {
                const maxCost = Math.max(...validResults.map(r => r.totalCost));
                const minCost = Math.min(...validResults.map(r => r.totalCost));

                validResults.forEach(r => {
                    r.savings = parseFloat((maxCost - r.totalCost).toFixed(2));
                    r.isBest = r.totalCost === minCost;
                    r.isWorst = r.totalCost === maxCost;
                });
            }

            // Ordenar por coste total (menor a mayor)
            results.sort((a, b) => {
                if (a.error) return 1;
                if (b.error) return -1;
                return a.totalCost - b.totalCost;
            });
        }

        console.log('\n=== COMPARACIÓN COMPLETADA ===');
        console.log(`Total resultados: ${results.length}`);
        console.log(`Mejor opción: ${results.find(r => r.isBest)?.countryName} (€${results.find(r => r.isBest)?.totalCost})`);

        return NextResponse.json({
            success: true,
            hsCode,
            cifValue: parsedCifValue,
            results
        });

    } catch (error) {
        console.error('Error in compare API:', error);
        return NextResponse.json(
            { error: 'Error del servidor: ' + error.message },
            { status: 500 }
        );
    }
}
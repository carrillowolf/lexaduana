'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import HSCodeAutocomplete from '@/components/HSCodeAutocomplete';

export default function ComparadorPage() {
    const [hsCode, setHsCode] = useState('');
    const [cifValue, setCifValue] = useState(1000);
    const [selectedCountries, setSelectedCountries] = useState([]);
    const [countries, setCountries] = useState([]);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const supabase = createClientComponentClient();

    useEffect(() => {
        loadCountries();
    }, []);

    async function loadCountries() {
        setLoadingCountries(true);
        console.log('Cargando países desde API...');

        try {
            const response = await fetch('/api/calculate');
            const data = await response.json();

            if (data.success && data.countries) {
                console.log('Países cargados:', data.countries.length);
                // Mapear al formato esperado
                const mappedCountries = data.countries.map(c => ({
                    code: c.country_code || c.code,
                    name: c.country_name || c.name,
                    has_agreement: c.has_agreement || false
                }));
                setCountries(mappedCountries);
            } else {
                console.error('Error en respuesta:', data);
            }
        } catch (error) {
            console.error('Error cargando países:', error);
        }

        setLoadingCountries(false);
    }

    function toggleCountry(code) {
        if (selectedCountries.includes(code)) {
            setSelectedCountries(selectedCountries.filter(c => c !== code));
        } else {
            if (selectedCountries.length >= 5) {
                alert('Máximo 5 países permitidos');
                return;
            }
            setSelectedCountries([...selectedCountries, code]);
        }
    }

    async function compareOrigins() {
        if (!hsCode || selectedCountries.length < 2) {
            alert('Selecciona al menos 2 países para comparar');
            return;
        }

        setLoading(true);
        setResults(null);

        try {
            const response = await fetch('/api/compare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hsCode,
                    cifValue: parseFloat(cifValue),
                    countryCodes: selectedCountries
                })
            });

            const data = await response.json();

            if (response.ok) {
                setResults(data);
            } else {
                alert(data.error || 'Error al comparar');
            }
        } catch (error) {
            console.error('Error comparing:', error);
            alert('Error al realizar la comparación');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Simulador Multi-Origen
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Compara costes de importación desde diferentes países
                    </p>
                </div>

                {/* Formulario */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* HS Code */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Código HS
                            </label>
                            <HSCodeAutocomplete
                                value={hsCode}
                                onChange={setHsCode}
                                placeholder="Ej: 8471300000"
                            />
                        </div>

                        {/* Valor CIF */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Valor CIF (€)
                            </label>
                            <input
                                type="number"
                                value={cifValue}
                                onChange={(e) => setCifValue(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>

                    {/* Selector de países */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Selecciona hasta 5 países para comparar
                        </label>
                        <p className="text-xs text-gray-600 mb-2">
                            💡 <strong>Nota:</strong> Si no encuentras el país que buscas, usa <strong>Terceros Países</strong> (Terceros Países) para ver el arancel estándar.
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                            {loadingCountries ? (
                                <p className="col-span-full text-center text-gray-500">Cargando países...</p>
                            ) : (
                                countries.map(country => (
                                    <button
                                        key={country.code}
                                        onClick={() => toggleCountry(country.code)}
                                        className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-all text-left
                      ${selectedCountries.includes(country.code)
                                                ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                                                : 'bg-gray-50 text-gray-700 border border-gray-300 hover:bg-gray-100'
                                            }
                    `}
                                    >
                                        {country.name}
                                        {country.has_agreement && (
                                            <span className="ml-1 text-xs">✓</span>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            Seleccionados: {selectedCountries.length}/5
                            {selectedCountries.length > 0 && ` (${selectedCountries.join(', ')})`}
                        </p>
                    </div>

                    {/* Botón comparar */}
                    <button
                        onClick={compareOrigins}
                        disabled={loading || selectedCountries.length < 2}
                        className={`
              w-full px-6 py-3 rounded-lg font-semibold transition-all
              ${loading || selectedCountries.length < 2
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                            }
            `}
                    >
                        {loading ? 'Comparando...' : 'Comparar Orígenes'}
                    </button>
                </div>

                {/* Resultados */}
                {results && (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Resultados para HS {results.hsCode}
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Valor CIF: €{results.cifValue.toLocaleString()}
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            País
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tipo Arancel
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Arancel
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            IVA
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Coste Total
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ahorro
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {results.results.map((result, idx) => (
                                        <tr
                                            key={`${result.countryCode}-${result.isPreferentialOption ? 'pref' : 'std'}-${idx}`}
                                            className={`
                                              ${result.isBest ? 'bg-green-50' : ''}
                                              ${result.isWorst ? 'bg-red-50' : ''}
                                              ${result.isPreferentialOption ? 'border-l-4 border-green-500' : ''}
                                            `}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                                            {result.countryName}
                                                            {result.isPreferentialOption && (
                                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                                                                    CON certificado origen
                                                                </span>
                                                            )}
                                                            {result.requiresCertificate === false && result.dutyType === 'erga_omnes' && result.countryCode === results.results.find(r => r.isPreferentialOption && r.countryCode === result.countryCode)?.countryCode && (
                                                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                                                                    SIN certificado
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                        <div className="text-xs text-gray-500">
                                                            {result.countryCode}
                                                        </div>
                                                    {result.isBest && (
                                                        <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                            MEJOR
                                                        </span>
                                                    )}
                                                    {result.isWorst && (
                                                        <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                                            PEOR
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {result.isPreferentialOption ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 font-semibold">
                                                            ⭐ Preferencial
                                                        </span>
                                                        {result.agreementInfo && (
                                                            <span className="text-xs text-gray-600">
                                                                {result.agreementInfo}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                                                        ERGA OMNES
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                <div className="font-medium text-gray-900">
                                                    €{(result.dutyAmount || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {result.dutyRate || 0}%
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                <div className="font-medium text-gray-900">
                                                    €{(result.vatAmount || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {result.vatRate}%
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                <div className={`text-lg font-bold ${result.isBest ? 'text-green-600' : 'text-gray-900'}`}>
                                                    €{(result.totalCost || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                {result.savings > 0 ? (
                                                    <span className="text-green-600 font-medium">
                                                        -€{(result.savings || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Resumen */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                            <p className="text-sm text-gray-600">
                                💡 <strong>Recomendación:</strong> El origen más económico es{' '}
                                <span className="font-semibold text-green-600">
                                    {results.results.find(r => r.isBest)?.countryName}
                                </span>
                                {' '}con un ahorro de{' '}
                                <span className="font-semibold text-green-600">
                                    €{results.results.find(r => r.isBest)?.savings.toLocaleString()}
                                </span>
                                {' '}respecto a la opción más cara.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
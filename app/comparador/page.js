'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import HSCodeAutocomplete from '@/components/HSCodeAutocomplete';
import Link from 'next/link'

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
        try {
            const response = await fetch('/api/calculate');
            const data = await response.json();

            if (data.success && data.countries) {
                const mappedCountries = data.countries.map(c => ({
                    code: c.country_code || c.code,
                    name: c.country_name || c.name,
                    has_agreement: c.has_agreement || false
                }));
                setCountries(mappedCountries);
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <img src="/logo.png" alt="LexAduana" className="h-10 w-10" />
                            <div>
                                <h1 className="text-xl font-bold text-[#0A3D5C]">Comparador Multi-Origen</h1>
                                <p className="text-xs text-gray-500">Compara hasta 5 países</p>
                            </div>
                        </div>

                        <nav className="hidden md:flex items-center space-x-1">
                            <Link href="/" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0A3D5C] hover:bg-gray-50 rounded-lg transition">
                                Calculadora
                            </Link>
                            <Link href="/dashboard" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0A3D5C] hover:bg-gray-50 rounded-lg transition">
                                Dashboard
                            </Link>
                            <Link href="/comparador" className="px-4 py-2 text-sm font-medium text-[#0A3D5C] bg-blue-50 rounded-lg">
                                Comparador
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Contenido principal */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Hero Info */}
                <div className="mb-8 bg-gradient-to-r from-[#0A3D5C] to-[#0d5078] rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-3xl font-bold mb-3">Simulador Multi-Origen ⚖️</h2>
                            <p className="text-blue-100 text-lg mb-2">Compara costes de importación desde diferentes países</p>
                            <p className="text-blue-200 text-sm">
                                Selecciona hasta 5 países y descubre cuál ofrece el mejor coste total para tu producto
                            </p>
                        </div>
                        <div className="hidden md:block">
                            <svg className="w-24 h-24 text-white/20" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Formulario */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
                    <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-8 py-6 border-b border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900">Datos para la Comparación</h3>
                        <p className="text-sm text-gray-600 mt-1">Introduce el producto y selecciona los países a comparar</p>
                    </div>

                    <div className="p-8 space-y-6">
                        {/* Grid de inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* HS Code */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Código TARIC (HS)
                                    <span className="ml-2 text-xs font-normal text-gray-500">10 dígitos</span>
                                </label>
                                <HSCodeAutocomplete
                                    value={hsCode}
                                    onChange={setHsCode}
                                    placeholder="Ej: 8471300000"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0A3D5C] focus:ring-4 focus:ring-[#0A3D5C]/10 outline-none transition-all"
                                />
                            </div>

                            {/* Valor CIF */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Valor CIF (€)
                                    <span className="ml-2 text-xs font-normal text-gray-500">Coste + Seguro + Flete</span>
                                </label>
                                <input
                                    type="number"
                                    value={cifValue}
                                    onChange={(e) => setCifValue(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0A3D5C] focus:ring-4 focus:ring-[#0A3D5C]/10 outline-none transition-all"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        {/* Selector de países */}
                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-gray-700">
                                Selecciona países para comparar
                                <span className="ml-2 text-xs font-normal text-gray-500">
                                    ({selectedCountries.length}/5 seleccionados)
                                </span>
                            </label>

                            {loadingCountries ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#0A3D5C] border-t-transparent"></div>
                                    <span className="ml-3 text-gray-600">Cargando países...</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    {countries.map((country) => (
                                        <button
                                            key={country.code}
                                            onClick={() => toggleCountry(country.code)}
                                            className={`
                                                px-4 py-3 rounded-xl text-sm font-medium transition-all border-2
                                                ${selectedCountries.includes(country.code)
                                                    ? 'bg-[#0A3D5C] text-white border-[#0A3D5C] shadow-lg scale-105'
                                                    : 'bg-white text-gray-700 border-gray-200 hover:border-[#0A3D5C] hover:bg-blue-50'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="truncate">{country.name}</span>
                                                {country.has_agreement && (
                                                    <span className="ml-1 text-[#F4C542]">⭐</span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Países seleccionados */}
                        {selectedCountries.length > 0 && (
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                <p className="text-sm font-semibold text-[#0A3D5C] mb-2">
                                    Países seleccionados:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedCountries.map((code) => {
                                        const country = countries.find(c => c.code === code);
                                        return (
                                            <span
                                                key={code}
                                                className="inline-flex items-center px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 border border-gray-200"
                                            >
                                                {country?.name}
                                                <button
                                                    onClick={() => toggleCountry(code)}
                                                    className="ml-2 text-red-500 hover:text-red-700"
                                                >
                                                    ✕
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Botón comparar */}
                        <button
                            onClick={compareOrigins}
                            disabled={loading || selectedCountries.length < 2}
                            className="w-full bg-gradient-to-r from-[#0A3D5C] to-[#0d5078] hover:from-[#083049] hover:to-[#0A3D5C] text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Comparando...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <span>Comparar Orígenes</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Resultados */}
                {results && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-fadeIn">
                        {/* Header resultados */}
                        <div className="bg-gradient-to-r from-emerald-500 to-green-500 px-8 py-6">
                            <h3 className="text-2xl font-bold text-white mb-1">Resultados de la Comparación</h3>
                            <p className="text-emerald-50 text-sm">Análisis completo de costes por origen</p>
                        </div>

                        <div className="p-8">
                            {/* Info del producto */}
                            <div className="mb-8 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 border border-gray-100">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Código TARIC</p>
                                        <p className="font-mono text-lg font-bold text-[#0A3D5C]">{results.hsCode}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Valor CIF</p>
                                        <p className="text-lg font-bold text-[#0A3D5C]">
                                            €{parseFloat(cifValue).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Tabla comparativa */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-2 border-gray-200">
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">País</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tipo Arancel</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Arancel</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">IVA</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Coste Total</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Ahorro</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {results.results.map((result, idx) => (
                                            <tr
                                                key={`${result.countryCode}-${result.isPreferentialOption ? 'pref' : 'std'}-${idx}`}
                                                className={`
                                                    transition-colors
                                                    ${result.isBest ? 'bg-gradient-to-r from-emerald-50 to-green-50' : ''}
                                                    ${result.isWorst ? 'bg-red-50' : ''}
                                                    ${result.isPreferentialOption ? 'border-l-4 border-emerald-500' : ''}
                                                    hover:bg-blue-50
                                                `}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-2">
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                                {result.countryName}
                                                                {result.isPreferentialOption && (
                                                                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">
                                                                        ✓ CON certificado
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-gray-500 font-mono mt-1">
                                                                {result.countryCode}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 flex gap-2">
                                                        {result.isBest && (
                                                            <span className="px-2 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                                                                🏆 MEJOR OPCIÓN
                                                            </span>
                                                        )}
                                                        {result.isWorst && (
                                                            <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800">
                                                                MÁS COSTOSO
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {result.isPreferentialOption ? (
                                                        <div className="space-y-1">
                                                            <span className="inline-block px-3 py-1 text-xs rounded-full bg-emerald-100 text-emerald-800 font-bold">
                                                                ⭐ Preferencial
                                                            </span>
                                                            {result.agreementInfo && (
                                                                <p className="text-xs text-gray-600 mt-1">
                                                                    {result.agreementInfo}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="inline-block px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-800 font-semibold">
                                                            ERGA OMNES
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="font-bold text-gray-900">
                                                        €{(result.dutyAmount || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                    </div>
                                                    <div className="text-xs text-gray-500 font-semibold">
                                                        {result.dutyRate || 0}%
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="font-bold text-gray-900">
                                                        €{(result.vatAmount || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                    </div>
                                                    <div className="text-xs text-gray-500 font-semibold">
                                                        {result.vatRate}%
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className={`text-xl font-bold ${result.isBest ? 'text-emerald-600' : 'text-gray-900'}`}>
                                                        €{(result.totalCost || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {result.savings > 0 ? (
                                                        <span className="text-emerald-600 font-bold text-sm">
                                                            -€{(result.savings || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
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

                            {/* Resumen y recomendación */}
                            <div className="mt-8 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 border-2 border-emerald-200">
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-900 mb-2">💡 Recomendación</h4>
                                        <p className="text-gray-700">
                                            El origen más económico es{' '}
                                            <span className="font-bold text-emerald-600">
                                                {results.results.find(r => r.isBest)?.countryName}
                                            </span>
                                            {' '}con un coste total de{' '}
                                            <span className="font-bold text-emerald-600">
                                                €{results.results.find(r => r.isBest)?.totalCost.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                            </span>
                                            {results.results.find(r => r.isBest)?.savings > 0 && (
                                                <>
                                                    , representando un ahorro de{' '}
                                                    <span className="font-bold text-emerald-600">
                                                        €{results.results.find(r => r.isBest)?.savings.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                    </span>
                                                    {' '}respecto a la opción más cara.
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Estilos para animaciones */}
            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}
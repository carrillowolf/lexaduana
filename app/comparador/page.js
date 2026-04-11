'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import HSCodeAutocomplete from '@/components/HSCodeAutocomplete';
import Link from 'next/link'
import { trackEvent } from '@/lib/analytics'
import { useTranslation } from '@/lib/i18n'
import { comparadorDict } from '@/lib/i18n/comparador'

export default function ComparadorPage() {
    const t = useTranslation(comparadorDict)
    const [hsCode, setHsCode] = useState('');
    const [cifValue, setCifValue] = useState(1000);
    const [selectedCountries, setSelectedCountries] = useState([]);
    const [countries, setCountries] = useState([]);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [filterPreference, setFilterPreference] = useState('all'); // 'all', 'preferential', 'standard'
    const [showOnlyWithAgreement, setShowOnlyWithAgreement] = useState(false);
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
                const mappedCountries = data.countries
                    .filter(c => {
                        // Filtrar "Terceros países" o códigos genéricos
                        const code = c.country_code || c.code;
                        const name = (c.country_name || c.name || '').toLowerCase();
                        return code &&
                               code !== 'ERGA OMNES' &&
                               !name.includes('terceros') &&
                               !name.includes('erga omnes');
                    })
                    .map(c => {
                        const reductionRate = parseFloat(c.reduction_rate) || 0;
                        const hasSanctions = reductionRate < 0;
                        const agreementType = c.agreement_type || '';

                        // Solo es acuerdo real si:
                        // - Tiene agreement_type válido
                        // - NO es "Sin acuerdo"
                        // - NO tiene sanciones
                        const hasRealAgreement = agreementType &&
                                                  agreementType !== 'Sin acuerdo' &&
                                                  !hasSanctions;

                        return {
                            code: c.country_code || c.code,
                            name: c.country_name || c.name,
                            has_agreement: hasRealAgreement,
                            has_sanctions: hasSanctions,
                            agreement_type: agreementType,
                            reduction_rate: reductionRate
                        };
                    });

                // Ordenar: primero con acuerdo, luego normales, al final sanciones
                mappedCountries.sort((a, b) => {
                    // Sanciones al final
                    if (a.has_sanctions && !b.has_sanctions) return 1;
                    if (!a.has_sanctions && b.has_sanctions) return -1;
                    // Acuerdos primero
                    if (a.has_agreement && !b.has_agreement) return -1;
                    if (!a.has_agreement && b.has_agreement) return 1;
                    // Alfabético
                    return a.name.localeCompare(b.name);
                });
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
                alert(t('form.maxCountries'));
                return;
            }
            setSelectedCountries([...selectedCountries, code]);
        }
    }

    async function compareOrigins() {
        if (!hsCode || selectedCountries.length < 2) {
            alert(t('form.minCountries'));
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
                trackEvent('compare_origins', { hs_code: hsCode, countries: selectedCountries.length })
            } else {
                alert(data.error || t('errors.compareError'));
            }
        } catch (error) {
            console.error('Error comparing:', error);
            alert(t('errors.comparisonError'));
        } finally {
            setLoading(false);
        }
    }

    // Filtrar resultados según preferencia seleccionada
    const filteredResults = results?.results?.filter(r => {
        if (filterPreference === 'all') return true;
        if (filterPreference === 'preferential') return r.isPreferentialOption;
        if (filterPreference === 'standard') return !r.isPreferentialOption;
        return true;
    }) || [];

    // Países filtrados para mostrar
    const displayedCountries = showOnlyWithAgreement
        ? countries.filter(c => c.has_agreement)
        : countries;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
            {/* Contenido principal */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Hero Info */}
                <div className="mb-8 bg-gradient-to-r from-[#0A3D5C] to-[#0d5078] rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-3xl font-bold mb-3">{t('hero.title')}</h2>
                            <p className="text-blue-100 text-lg mb-2">{t('hero.subtitle')}</p>
                            <p className="text-blue-200 text-sm">
                                {t('hero.desc')}
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
                        <h3 className="text-xl font-bold text-gray-900">{t('form.title')}</h3>
                        <p className="text-sm text-gray-600 mt-1">{t('form.subtitle')}</p>
                    </div>

                    <div className="p-8 space-y-6">
                        {/* Grid de inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* HS Code */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    {t('form.hsCodeLabel')}
                                    <span className="ml-2 text-xs font-normal text-gray-500">{t('form.hsCodeDigits')}</span>
                                </label>
                                <HSCodeAutocomplete
                                    value={hsCode}
                                    onChange={setHsCode}
                                    placeholder="Ej: 8471300000"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0A3D5C] focus:ring-4 focus:ring-[#0A3D5C]/10 outline-none transition-all"
                                />
                                <p className="text-xs text-gray-500">
                                    {t('form.hsCodeHelp')} <Link href="/clasificador" className="text-[#0A3D5C] font-medium hover:underline">{t('form.hsCodeLink')}</Link>
                                </p>
                            </div>

                            {/* Valor CIF */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    {t('form.cifLabel')}
                                    <span className="ml-2 text-xs font-normal text-gray-500">{t('form.cifHint')}</span>
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
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-semibold text-gray-700">
                                    {t('form.selectCountries')}
                                    <span className="ml-2 text-xs font-normal text-gray-500">
                                        ({t('form.selectedCount').replace('{count}', selectedCountries.length)})
                                    </span>
                                </label>
                                <label className="flex items-center text-sm text-gray-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showOnlyWithAgreement}
                                        onChange={(e) => setShowOnlyWithAgreement(e.target.checked)}
                                        className="mr-2 rounded border-gray-300 text-[#0A3D5C] focus:ring-[#0A3D5C]"
                                    />
                                    {t('form.onlyWithAgreement')}
                                </label>
                            </div>

                            {/* Leyenda de colores */}
                            <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-2">
                                <span className="flex items-center"><span className="w-3 h-3 bg-amber-200 rounded mr-1"></span> {t('form.legendPreferential')}</span>
                                <span className="flex items-center"><span className="w-3 h-3 bg-red-200 rounded mr-1"></span> {t('form.legendSanctions')}</span>
                                <span className="flex items-center"><span className="w-3 h-3 bg-gray-200 rounded mr-1"></span> {t('form.legendNoAgreement')}</span>
                            </div>

                            {loadingCountries ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#0A3D5C] border-t-transparent"></div>
                                    <span className="ml-3 text-gray-600">{t('form.loadingCountries')}</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-80 overflow-y-auto p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    {displayedCountries.map((country) => (
                                        <button
                                            key={country.code}
                                            onClick={() => toggleCountry(country.code)}
                                            className={`
                                                px-4 py-3 rounded-xl text-sm font-medium transition-all border-2 text-left
                                                ${selectedCountries.includes(country.code)
                                                    ? country.has_sanctions
                                                        ? 'bg-red-600 text-white border-red-600 shadow-lg scale-[1.02]'
                                                        : 'bg-[#0A3D5C] text-white border-[#0A3D5C] shadow-lg scale-[1.02]'
                                                    : country.has_sanctions
                                                        ? 'bg-red-50 text-red-700 border-red-300 hover:border-red-500 hover:bg-red-100'
                                                        : country.has_agreement
                                                            ? 'bg-amber-50 text-gray-700 border-amber-200 hover:border-[#0A3D5C] hover:bg-amber-100'
                                                            : 'bg-white text-gray-700 border-gray-200 hover:border-[#0A3D5C] hover:bg-blue-50'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="truncate">{country.name}</span>
                                                {country.has_sanctions && (
                                                    <span className={`ml-1 ${selectedCountries.includes(country.code) ? 'text-white' : 'text-red-500'}`}>⚠️</span>
                                                )}
                                                {country.has_agreement && !country.has_sanctions && (
                                                    <span className={`ml-1 ${selectedCountries.includes(country.code) ? 'text-[#F4C542]' : 'text-amber-500'}`}>⭐</span>
                                                )}
                                            </div>
                                            {country.has_sanctions && !selectedCountries.includes(country.code) && (
                                                <p className="text-xs text-red-600 mt-1 font-semibold">{t('form.euSanctions')}</p>
                                            )}
                                            {country.has_agreement && !country.has_sanctions && !selectedCountries.includes(country.code) && (
                                                <p className="text-xs text-amber-600 mt-1 truncate">{country.agreement_type}</p>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Países seleccionados */}
                        {selectedCountries.length > 0 && (
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                <p className="text-sm font-semibold text-[#0A3D5C] mb-2">
                                    {t('form.selectedLabel')}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedCountries.map((code) => {
                                        const country = countries.find(c => c.code === code);
                                        return (
                                            <span
                                                key={code}
                                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                                                    country?.has_sanctions
                                                        ? 'bg-red-50 text-red-800 border-red-300'
                                                        : country?.has_agreement
                                                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                            : 'bg-white text-gray-700 border-gray-200'
                                                }`}
                                            >
                                                {country?.name}
                                                {country?.has_sanctions && <span className="ml-1">⚠️</span>}
                                                {country?.has_agreement && !country?.has_sanctions && <span className="ml-1">⭐</span>}
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
                                    <span>{t('form.comparing')}</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <span>{t('form.compare')}</span>
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
                            <h3 className="text-2xl font-bold text-white mb-1">{t('results.title')}</h3>
                            <p className="text-emerald-50 text-sm">{t('results.subtitle')}</p>
                        </div>

                        <div className="p-8">
                            {/* Info del producto */}
                            <div className="mb-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 border border-gray-100">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('results.hsCodeLabel')}</p>
                                        <p className="font-mono text-lg font-bold text-[#0A3D5C]">{results.hsCode}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('results.cifLabel')}</p>
                                        <p className="text-lg font-bold text-[#0A3D5C]">
                                            €{parseFloat(cifValue).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Filtro de preferencias */}
                            <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 flex items-center">
                                            <span className="mr-2">📋</span>
                                            {t('results.certQuestion')}
                                        </h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {t('results.certTypes')}
                                        </p>
                                    </div>
                                    <div className="flex rounded-lg overflow-hidden border border-amber-300 bg-white">
                                        <button
                                            onClick={() => setFilterPreference('all')}
                                            className={`px-4 py-2 text-sm font-medium transition-colors ${
                                                filterPreference === 'all'
                                                    ? 'bg-[#0A3D5C] text-white'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            {t('results.filterAll')}
                                        </button>
                                        <button
                                            onClick={() => setFilterPreference('preferential')}
                                            className={`px-4 py-2 text-sm font-medium transition-colors border-l border-amber-300 ${
                                                filterPreference === 'preferential'
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            {t('results.filterYes')}
                                        </button>
                                        <button
                                            onClick={() => setFilterPreference('standard')}
                                            className={`px-4 py-2 text-sm font-medium transition-colors border-l border-amber-300 ${
                                                filterPreference === 'standard'
                                                    ? 'bg-gray-500 text-white'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            {t('results.filterNo')}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Leyenda */}
                            <div className="mb-6 flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center">
                                    <span className="w-4 h-4 bg-emerald-500 rounded mr-2"></span>
                                    <span className="text-gray-600">{t('results.legendWithCert')}</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="w-4 h-4 bg-gray-300 rounded mr-2"></span>
                                    <span className="text-gray-600">{t('results.legendWithoutCert')}</span>
                                </div>
                            </div>

                            {/* Tabla comparativa */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-2 border-gray-200">
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">{t('results.colCountry')}</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">{t('results.colType')}</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">{t('results.colDuty')}</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">{t('results.colVat')}</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">{t('results.colTotal')}</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">{t('results.colSavings')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredResults.map((result, idx) => (
                                            <tr
                                                key={`${result.countryCode}-${result.isPreferentialOption ? 'pref' : 'std'}-${idx}`}
                                                className={`
                                                    transition-colors
                                                    ${result.isBest ? 'bg-gradient-to-r from-emerald-50 to-green-50' : ''}
                                                    ${result.isWorst && !result.isBest ? 'bg-red-50/50' : ''}
                                                    hover:bg-blue-50/50
                                                `}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        {/* Indicador visual de tipo */}
                                                        <div className={`w-1.5 h-12 rounded-full ${result.isPreferentialOption ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                                {result.countryName}
                                                                {result.isBest && (
                                                                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                                                                        🏆 {t('results.best')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                {result.isPreferentialOption ? (
                                                                    <span className="text-emerald-600 font-medium">{t('results.withCert')}</span>
                                                                ) : (
                                                                    <span className="text-gray-500">{t('results.withoutCert')}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {result.isPreferentialOption ? (
                                                        <div>
                                                            <span className="inline-block px-3 py-1 text-xs rounded-full bg-emerald-100 text-emerald-800 font-bold">
                                                                {t('results.preferential')}
                                                            </span>
                                                            {result.agreementInfo && (
                                                                <p className="text-xs text-gray-500 mt-1 max-w-[150px] truncate" title={result.agreementInfo}>
                                                                    {result.agreementInfo}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="inline-block px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700 font-semibold">
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
                                                        {result.vatRate}% {result.vatType !== 'general' && `(${result.vatType})`}
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

                            {/* Mensaje si no hay resultados con el filtro */}
                            {filteredResults.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <p>{t('results.noResults')}</p>
                                    <button
                                        onClick={() => setFilterPreference('all')}
                                        className="mt-2 text-[#0A3D5C] font-medium hover:underline"
                                    >
                                        {t('results.showAll')}
                                    </button>
                                </div>
                            )}

                            {/* Resumen y recomendación */}
                            {filteredResults.length > 0 && (
                                <div className="mt-8 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 border-2 border-emerald-200">
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0">
                                            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-900 mb-2">💡 {t('recommendation.title')}</h4>
                                            {(() => {
                                                const best = filteredResults.find(r => r.isBest) || filteredResults[0];
                                                return (
                                                    <p className="text-gray-700">
                                                        {filterPreference === 'preferential' && (
                                                            <span className="font-medium text-emerald-700">{t('recommendation.withCert')}</span>
                                                        )}
                                                        {filterPreference === 'standard' && (
                                                            <span className="font-medium text-gray-700">{t('recommendation.withoutCert')}</span>
                                                        )}
                                                        {t('recommendation.bestOrigin')}{' '}
                                                        <span className="font-bold text-emerald-600">
                                                            {best?.countryName}
                                                        </span>
                                                        {best?.isPreferentialOption && (
                                                            <span className="text-emerald-600">{t('recommendation.withCertNote')}</span>
                                                        )}
                                                        {' '}{t('recommendation.totalCost')}{' '}
                                                        <span className="font-bold text-emerald-600">
                                                            €{best?.totalCost?.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                        </span>
                                                        {best?.savings > 0 && (
                                                            <>
                                                                {t('recommendation.savingsNote')}{' '}
                                                                <span className="font-bold text-emerald-600">
                                                                    €{best?.savings?.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                                </span>
                                                                {' '}{t('recommendation.vsWorst')}
                                                            </>
                                                        )}
                                                    </p>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Nota informativa sobre certificados */}
                            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                                <h5 className="font-semibold text-[#0A3D5C] text-sm mb-2">ℹ️ {t('certInfo.title')}</h5>
                                <p className="text-sm text-gray-600">
                                    {t('certInfo.text')}
                                </p>
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

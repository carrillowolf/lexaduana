'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AdvisoryStatusBadge from '@/components/cbam/advisory/AdvisoryStatusBadge'
import { useTranslation, useLocale } from '@/lib/i18n'
import { cbamDict } from '@/lib/i18n/cbam'
import CbamBreadcrumb from '@/components/cbam/CbamBreadcrumb'

export default function MisSolicitudesPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const t = useTranslation(cbamDict)
  const locale = useLocale()
  const numLocale = locale === 'en' ? 'en-GB' : 'es-ES'

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString(numLocale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  function formatCurrency(value) {
    if (value == null) return '—'
    return new Intl.NumberFormat(numLocale, {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/cbam/advisory')
        if (res.status === 401) {
          setError(t('myRequests.loginRequired'))
          setLoading(false)
          return
        }
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)
        setRequests(json.data || [])
      } catch (err) {
        setError(err.message || 'Error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleDownload(id) {
    try {
      const res = await fetch(`/api/cbam/advisory/${id}/download`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error')
      window.open(json.signedUrl, '_blank')
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm(t('myRequests.confirmDelete'))) return
    try {
      const res = await fetch(`/api/cbam/advisory/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error)
      }
      setRequests(requests.filter(r => r.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CbamBreadcrumb />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#0A3D5C]">{t('myRequests.title')}</h1>
            <p className="text-sm text-gray-600 mt-1">{t('myRequests.subtitle')}</p>
          </div>
          <Link
            href="/cbam/asesoria/solicitud"
            className="px-4 py-2.5 bg-[#0A3D5C] text-white rounded-lg text-sm font-medium hover:bg-[#0d5078] transition-colors"
          >
            {t('myRequests.newRequest')}
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block w-6 h-6 border-2 border-[#0A3D5C] border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-sm text-gray-500">{t('myRequests.loading')}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && requests.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-medium text-gray-700 mb-1">{t('myRequests.emptyTitle')}</p>
            <p className="text-sm text-gray-500 mb-4">
              {t('myRequests.emptyDesc')}
            </p>
            <Link
              href="/cbam/asesoria/solicitud"
              className="inline-block px-4 py-2 bg-[#0A3D5C] text-white rounded-lg text-sm font-medium hover:bg-[#0d5078] transition-colors"
            >
              {t('myRequests.createRequest')}
            </Link>
          </div>
        )}

        {/* List */}
        {!loading && requests.length > 0 && (
          <div className="space-y-3">
            {requests.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="font-semibold text-gray-900 truncate">{r.companyName}</h3>
                      <AdvisoryStatusBadge status={r.status} />
                      {r.reportRef && (
                        <span className="font-mono text-xs text-gray-500">{r.reportRef}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {r.contactName} &middot; {t('myRequests.created')} {formatDate(r.createdAt)}
                      {r.submittedAt && ` · ${t('myRequests.submitted')} ${formatDate(r.submittedAt)}`}
                      {r.deliveredAt && ` · ${t('myRequests.delivered')} ${formatDate(r.deliveredAt)}`}
                    </p>

                    {/* Contextual message by status */}
                    {(r.status === 'intake_complete' || r.status === 'reviewing') && (
                      <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5 inline-block">
                        {t('myRequests.statusReviewing')}
                      </p>
                    )}
                    {r.status === 'report_ready' && (
                      <p className="mt-2 text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded-md px-3 py-1.5 inline-block">
                        {t('myRequests.statusReportReady')}
                      </p>
                    )}
                    {r.status === 'pending_payment' && (
                      <p className="mt-2 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-md px-3 py-1.5 inline-block">
                        {t('myRequests.statusPendingPayment')} {r.invoiceRef ? `(${r.invoiceRef})` : ''}{t('myRequests.statusPendingPaymentEnd')}
                      </p>
                    )}
                    {r.status === 'paid' && (
                      <p className="mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-1.5 inline-block">
                        {t('myRequests.statusPaid')}
                      </p>
                    )}
                    {r.status === 'delivered' && (
                      <p className="mt-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-1.5 inline-block">
                        {t('myRequests.statusDelivered')}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {r.totalEstimatedCost != null && (
                      <span className="text-lg font-bold text-[#0A3D5C]">
                        {formatCurrency(r.totalEstimatedCost)}
                      </span>
                    )}

                    <div className="flex items-center gap-3">
                      {r.status === 'delivered' && (
                        <button
                          onClick={() => handleDownload(r.id)}
                          className="px-3 py-1.5 bg-[#0A3D5C] text-white rounded-lg text-sm font-medium hover:bg-[#0d5078] transition-colors"
                        >
                          {t('myRequests.downloadReport')}
                        </button>
                      )}

                      {r.status === 'draft' && (
                        <>
                          <Link
                            href="/cbam/asesoria/solicitud"
                            className="text-sm text-[#0A3D5C] hover:underline font-medium"
                          >
                            {t('myRequests.continue')}
                          </Link>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="text-sm text-red-500 hover:text-red-700"
                          >
                            {t('myRequests.delete')}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

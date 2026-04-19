'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AdvisoryStatusBadge from '@/components/cbam/advisory/AdvisoryStatusBadge'
import { useTranslation, useLocale } from '@/lib/i18n'
import { cbamDict } from '@/lib/i18n/cbam'
import CbamBreadcrumb from '@/components/cbam/CbamBreadcrumb'

function formatDate(dateStr, numLocale) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString(numLocale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatCurrency(value, numLocale) {
  if (value == null) return '—'
  return new Intl.NumberFormat(numLocale, {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

function MonitoringStatusBadge({ status, t }) {
  const map = {
    submitted: { label: t('myRequests.monitoring.statusSubmitted'), cls: 'bg-amber-100 text-amber-800' },
    authorized: { label: t('myRequests.monitoring.statusAuthorized'), cls: 'bg-blue-100 text-blue-800' },
    active: { label: t('myRequests.monitoring.statusActive'), cls: 'bg-emerald-100 text-emerald-800' },
    paused: { label: t('myRequests.monitoring.statusPaused'), cls: 'bg-gray-100 text-gray-700' },
    cancelled: { label: t('myRequests.monitoring.statusCancelled'), cls: 'bg-red-100 text-red-800' },
  }
  const entry = map[status] || map.submitted
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${entry.cls}`}>
      {entry.label}
    </span>
  )
}

function AdvisorySection({ requests, loading, error, onDownload, onDelete, onNewClick, t, numLocale }) {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{t('myRequests.sectionAdvisoryTitle')}</h2>
          <p className="text-sm text-gray-500">{t('myRequests.sectionAdvisoryDesc')}</p>
        </div>
        <button
          type="button"
          onClick={onNewClick}
          className="px-4 py-2 bg-[#0A3D5C] text-white rounded-lg text-sm font-medium hover:bg-[#0d5078] transition-colors"
          data-testid="advisory-new-request-cta"
        >
          {t('myRequests.newAdvisory')}
        </button>
      </div>

      {loading && (
        <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
          <div className="inline-block w-5 h-5 border-2 border-[#0A3D5C] border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 text-sm text-gray-500">{t('myRequests.loading')}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && requests.length === 0 && (
        <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
          <p className="font-medium text-gray-700 mb-1">{t('myRequests.emptyTitle')}</p>
          <p className="text-sm text-gray-500 mb-4">{t('myRequests.emptyDesc')}</p>
          <Link
            href="/cbam/asesoria/solicitud"
            className="inline-block px-4 py-2 bg-[#0A3D5C] text-white rounded-lg text-sm font-medium hover:bg-[#0d5078] transition-colors"
          >
            {t('myRequests.createRequest')}
          </Link>
        </div>
      )}

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
                    {r.contactName} &middot; {t('myRequests.created')} {formatDate(r.createdAt, numLocale)}
                    {r.submittedAt && ` · ${t('myRequests.submitted')} ${formatDate(r.submittedAt, numLocale)}`}
                    {r.deliveredAt && ` · ${t('myRequests.delivered')} ${formatDate(r.deliveredAt, numLocale)}`}
                  </p>

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
                      {formatCurrency(r.totalEstimatedCost, numLocale)}
                    </span>
                  )}

                  <div className="flex items-center gap-3">
                    {r.status === 'delivered' && (
                      <button
                        onClick={() => onDownload(r.id)}
                        className="px-3 py-1.5 bg-[#0A3D5C] text-white rounded-lg text-sm font-medium hover:bg-[#0d5078] transition-colors"
                      >
                        {t('myRequests.downloadReport')}
                      </button>
                    )}

                    {r.status === 'draft' && (
                      <>
                        <Link
                          href={`/cbam/asesoria/solicitud?draftId=${r.id}`}
                          className="text-sm text-[#0A3D5C] hover:underline font-medium"
                          data-testid={`advisory-draft-continue-${r.id}`}
                        >
                          {t('myRequests.continue')}
                        </Link>
                        <button
                          onClick={() => onDelete(r.id)}
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
    </section>
  )
}

function MonitoringSection({ subscriptions, loading, error, t, numLocale }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{t('myRequests.sectionMonitoringTitle')}</h2>
          <p className="text-sm text-gray-500">{t('myRequests.sectionMonitoringDesc')}</p>
        </div>
        <Link
          href="/cbam/asesoria/solicitud/monitorizacion"
          className="px-4 py-2 bg-white border border-[#0A3D5C] text-[#0A3D5C] rounded-lg text-sm font-medium hover:bg-[#0A3D5C] hover:text-white transition-colors"
        >
          {t('myRequests.newMonitoring')}
        </Link>
      </div>

      {loading && (
        <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
          <div className="inline-block w-5 h-5 border-2 border-[#0A3D5C] border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 text-sm text-gray-500">{t('myRequests.loading')}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && subscriptions.length === 0 && (
        <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500 mb-4">{t('myRequests.monitoring.empty')}</p>
          <Link
            href="/cbam/asesoria"
            className="inline-block px-4 py-2 bg-white border border-[#0A3D5C] text-[#0A3D5C] rounded-lg text-sm font-medium hover:bg-[#0A3D5C] hover:text-white transition-colors"
          >
            {t('myRequests.monitoring.emptyCta')}
          </Link>
        </div>
      )}

      {!loading && subscriptions.length > 0 && (
        <div className="space-y-3">
          {subscriptions.map((s) => {
            const products = (s.mainCbamProducts && s.mainCbamProducts.length > 0)
              ? s.mainCbamProducts.join(', ')
              : t('myRequests.monitoring.noProducts')
            return (
              <div
                key={s.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="font-semibold text-gray-900 truncate">{s.companyName}</h3>
                      <MonitoringStatusBadge status={s.status} t={t} />
                    </div>
                    <p className="text-sm text-gray-500">
                      {s.contactName} &middot; {t('myRequests.monitoring.submittedOn')} {formatDate(s.createdAt, numLocale)}
                      {s.startedAt && ` · ${t('myRequests.monitoring.activeSince')} ${formatDate(s.startedAt, numLocale)}`}
                      {s.pausedAt && !s.cancelledAt && ` · ${t('myRequests.monitoring.pausedOn')} ${formatDate(s.pausedAt, numLocale)}`}
                      {s.cancelledAt && ` · ${t('myRequests.monitoring.cancelledOn')} ${formatDate(s.cancelledAt, numLocale)}`}
                    </p>
                    <div className="mt-2 text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                      <span>
                        <span className="text-gray-500">{t('myRequests.monitoring.volume')}:</span>{' '}
                        <span className="font-medium text-gray-800">{s.expectedMonthlyVolume || '—'}</span>
                      </span>
                      <span className="truncate max-w-md">
                        <span className="text-gray-500">{t('myRequests.monitoring.products')}:</span>{' '}
                        <span className="font-medium text-gray-800">{products}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-base font-bold text-[#0A3D5C]">199 €</span>
                    <span className="block text-xs text-gray-500">/mes</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function ExistingDraftModal({ drafts, onContinue, onDiscard, onClose, busy, t }) {
  const latest = drafts[0]
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      data-testid="existing-draft-modal"
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{t('myRequests.existingDraftTitle')}</h3>
        <p className="text-sm text-gray-700 mb-2">{t('myRequests.existingDraftBody')}</p>
        {latest && (
          <p className="text-xs text-gray-500 mb-4">
            {latest.companyName || '—'}{' '}
            <span className="font-mono text-[11px]">#{latest.id.slice(0, 8)}</span>
          </p>
        )}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            {t('myRequests.existingDraftCancel')}
          </button>
          <button
            type="button"
            onClick={onDiscard}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-sm font-medium text-red-700 border border-red-200 bg-red-50 hover:bg-red-100 disabled:opacity-50"
            data-testid="existing-draft-discard"
          >
            {t('myRequests.existingDraftDiscard')}
          </button>
          <button
            type="button"
            onClick={onContinue}
            disabled={busy}
            className="px-5 py-2.5 rounded-lg bg-[#0A3D5C] text-white text-sm font-semibold hover:bg-[#0d5078] disabled:opacity-50"
            data-testid="existing-draft-continue"
          >
            {t('myRequests.existingDraftContinue')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MisSolicitudesPage() {
  const router = useRouter()
  const [advisoryRequests, setAdvisoryRequests] = useState([])
  const [advisoryLoading, setAdvisoryLoading] = useState(true)
  const [advisoryError, setAdvisoryError] = useState(null)

  const [monitoringSubs, setMonitoringSubs] = useState([])
  const [monitoringLoading, setMonitoringLoading] = useState(true)
  const [monitoringError, setMonitoringError] = useState(null)

  const [draftModalOpen, setDraftModalOpen] = useState(false)
  const [draftModalBusy, setDraftModalBusy] = useState(false)

  const t = useTranslation(cbamDict)
  const locale = useLocale()
  const numLocale = locale === 'en' ? 'en-GB' : 'es-ES'

  const drafts = advisoryRequests.filter(r => r.status === 'draft')

  useEffect(() => {
    async function loadAdvisory() {
      try {
        const res = await fetch('/api/cbam/advisory')
        if (res.status === 401) {
          setAdvisoryError(t('myRequests.loginRequired'))
          return
        }
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)
        setAdvisoryRequests(json.data || [])
      } catch (err) {
        setAdvisoryError(err.message || 'Error')
      } finally {
        setAdvisoryLoading(false)
      }
    }

    async function loadMonitoring() {
      try {
        const res = await fetch('/api/cbam/monitoring')
        if (res.status === 401) {
          setMonitoringError(t('myRequests.loginRequired'))
          return
        }
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)
        setMonitoringSubs(json.data || [])
      } catch (err) {
        setMonitoringError(err.message || 'Error')
      } finally {
        setMonitoringLoading(false)
      }
    }

    loadAdvisory()
    loadMonitoring()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setAdvisoryRequests(advisoryRequests.filter(r => r.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  function handleNewAdvisoryClick() {
    if (drafts.length > 0) {
      setDraftModalOpen(true)
      return
    }
    router.push('/cbam/asesoria/solicitud')
  }

  function handleContinueDraft() {
    const latest = drafts[0]
    if (!latest) return
    setDraftModalOpen(false)
    router.push(`/cbam/asesoria/solicitud?draftId=${latest.id}`)
  }

  async function handleDiscardAllDrafts() {
    if (drafts.length === 0) return
    setDraftModalBusy(true)
    try {
      await Promise.all(
        drafts.map(d =>
          fetch(`/api/cbam/advisory/${d.id}`, { method: 'DELETE' }).catch(() => null),
        ),
      )
      setAdvisoryRequests(prev => prev.filter(r => r.status !== 'draft'))
      setDraftModalOpen(false)
      router.push('/cbam/asesoria/solicitud')
    } finally {
      setDraftModalBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CbamBreadcrumb />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0A3D5C]">{t('myRequests.title')}</h1>
          <p className="text-sm text-gray-600 mt-1">{t('myRequests.subtitle')}</p>
        </div>

        <AdvisorySection
          requests={advisoryRequests}
          loading={advisoryLoading}
          error={advisoryError}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onNewClick={handleNewAdvisoryClick}
          t={t}
          numLocale={numLocale}
        />

        <MonitoringSection
          subscriptions={monitoringSubs}
          loading={monitoringLoading}
          error={monitoringError}
          t={t}
          numLocale={numLocale}
        />
      </main>

      {draftModalOpen && (
        <ExistingDraftModal
          drafts={drafts}
          busy={draftModalBusy}
          onContinue={handleContinueDraft}
          onDiscard={handleDiscardAllDrafts}
          onClose={() => setDraftModalOpen(false)}
          t={t}
        />
      )}
    </div>
  )
}

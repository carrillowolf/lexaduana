'use client'

import Link from 'next/link'
import { FileText } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { origenDict } from '@/lib/i18n/origen'
import CountrySelect from './CountrySelect'
import VerdictBanner from './VerdictBanner'
import AgreementCard from './AgreementCard'
import ProofCard from './ProofCard'
import ConditionsAccordion from './ConditionsAccordion'
import Capa2Notice from './Capa2Notice'

export default function OriginProfile({ data, countries = [] }) {
  const t = useTranslation(origenDict)
  const { country, hasPreference, agreements } = data

  const latestReview = agreements
    .map((a) => a.lastReviewed)
    .filter(Boolean)
    .sort()
    .pop()

  return (
    <div className="max-w-3xl mx-auto px-5 pt-7 pb-12">
      <h1 className="text-sm font-semibold text-slate-500 tracking-wide mb-3.5">
        {t('origen.titulo')}
      </h1>

      <CountrySelect countries={countries} />

      <div className="mt-5">
        <VerdictBanner hasPreference={hasPreference} />
      </div>

      {agreements.map((agreement, i) => (
        <div key={i}>
          <AgreementCard agreement={agreement} />

          {agreement.proofsCurrent.length > 0 && (
            <>
              <h2 className="text-[17px] font-semibold mt-6 mb-3 text-[#0A3D5C]">
                {t('origen.como_acreditar')}
              </h2>
              {agreement.proofsCurrent.map((proof, j) => (
                <ProofCard key={j} proof={proof} countryName={country.name} />
              ))}
            </>
          )}

          <ConditionsAccordion agreement={agreement} />

          {agreement.proofsRetired.length > 0 && (
            <p className="text-[13px] text-slate-400 mt-2 mb-3">
              {t('origen.retirados')}:{' '}
              {agreement.proofsRetired.map((p, j) => {
                const name = t(`origen.proof.${p.proofType}`)
                const since = p.validTo
                return (
                  <span key={j}>
                    {j > 0 && ', '}
                    {name} ({t('origen.retirado_desde').replace('{date}', since)})
                  </span>
                )
              })}
            </p>
          )}

          <Capa2Notice agreement={agreement} />
        </div>
      ))}

      <div className="flex items-center justify-between gap-3.5 flex-wrap pt-1">
        <Link
          href="/comparador"
          className="inline-flex items-center gap-[7px] text-[#0c4a6e] font-medium hover:underline"
        >
          <FileText className="w-[17px] h-[17px]" />
          {t('origen.calc_link')}
        </Link>
        {latestReview && (
          <span className="text-xs text-slate-400">
            {t('origen.ultima_revision').replace('{date}', latestReview)}
          </span>
        )}
      </div>
    </div>
  )
}

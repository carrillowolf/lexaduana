import { getAllCountries } from '@/lib/cbamService'
import CbamBreadcrumb from '@/components/cbam/CbamBreadcrumb'
import CalculatorClient from '@/components/cbam/calculator/CalculatorClient'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export const metadata = {
  title: 'Calculadora CBAM | LexAduana',
  description: 'Estima tu exposición CBAM con datos oficiales de la Comisión Europea. Hasta 5 productos, escenario dual (reales/defaults), historial guardado. Reg. 2025/2620 y 2025/2621.',
}

export default async function CbamCalculadoraPage() {
  let countries = []
  try {
    countries = await getAllCountries()
  } catch (err) {
    console.error('[cbam/calculadora] error loading countries', err)
    countries = []
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <CbamBreadcrumb />
      <CalculatorClient countries={countries} />
    </div>
  )
}

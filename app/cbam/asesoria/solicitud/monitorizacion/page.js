import CbamBreadcrumb from '@/components/cbam/CbamBreadcrumb'
import MonitoringSubscriptionForm from '@/components/cbam/advisory/MonitoringSubscriptionForm'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Solicitar Monitorización CBAM | LexAduana',
  description: 'Alta en el servicio de Monitorización CBAM de LexAduana. 199 €/mes sin permanencia.',
}

export default function MonitoringRequestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <CbamBreadcrumb />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <MonitoringSubscriptionForm />
      </main>
    </div>
  )
}

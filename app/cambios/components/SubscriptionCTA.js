'use client'

export default function SubscriptionCTA() {
  return (
    <div className="bg-gradient-to-r from-[#141B2D] to-[#1A2235] border border-[#C49B38]/30 rounded-xl p-6 text-center">
      <h3 className="text-lg font-semibold text-[#E8E8E8] mb-2">
        Alertas de cambios arancelarios
      </h3>
      <p className="text-sm text-[#8B95A5] mb-4 max-w-md mx-auto">
        Recibe notificaciones cuando cambien los aranceles de tus partidas.
        Configuración por código HS, capítulo o tipo de medida.
      </p>
      <span className="inline-flex items-center px-4 py-2 bg-[#C49B38]/20 text-[#C49B38] rounded-lg text-sm font-medium border border-[#C49B38]/30">
        Próximamente
      </span>
    </div>
  )
}

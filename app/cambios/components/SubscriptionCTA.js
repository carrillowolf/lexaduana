'use client'

export default function SubscriptionCTA() {
  return (
    <div className="bg-[#0A3D5C] rounded-xl p-6 text-center">
      <h3 className="text-lg font-semibold text-white mb-2">
        Alertas de cambios arancelarios
      </h3>
      <p className="text-sm text-white/60 mb-4 max-w-md mx-auto">
        Recibe notificaciones cuando cambien los aranceles de tus partidas.
        Configuración por código HS, capítulo o tipo de medida.
      </p>
      <span className="inline-flex items-center px-4 py-2 bg-white/10 text-white/80 rounded-lg text-sm font-medium border border-white/20">
        Próximamente
      </span>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  
  const supabase = createClientComponentClient()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        throw error
      }

      setMessage('Se ha enviado un enlace de recuperación a tu correo electrónico. Por favor, revisa tu bandeja de entrada.')
    } catch (err) {
      setError(err.message || 'Error al enviar el correo de recuperación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-[#0A3D5C] rounded-xl flex items-center justify-center">
              <span className="text-[#F4C542] font-bold text-xl">L</span>
            </div>
            <span className="text-2xl font-bold text-[#0A3D5C]">LexAduana</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-[#0A3D5C] text-center mb-2">
            Recuperar contraseña
          </h1>
          <p className="text-gray-500 text-center mb-6">
            Introduce tu email y te enviaremos un enlace para restablecer tu contraseña
          </p>

          {/* Success Message */}
          {message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✅</span>
                <p className="text-green-700 text-sm">{message}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-red-500 text-xl">⚠️</span>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          {!message && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0A3D5C] focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#0A3D5C] text-white font-semibold rounded-xl hover:bg-[#0A3D5C]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  </>
                ) : (
                  <>
                    📧 Enviar enlace de recuperación
                  </>
                )}
              </button>
            </form>
          )}

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link 
              href="/auth/login" 
              className="text-[#0A3D5C] hover:underline font-medium inline-flex items-center gap-1"
            >
              ← Volver al inicio de sesión
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          © 2025 LexAduana. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}

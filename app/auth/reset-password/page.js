'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [isValidSession, setIsValidSession] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    // Verificar si hay una sesión válida (el usuario llegó desde el email)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setIsValidSession(true)
      } else {
        // Intentar recuperar la sesión desde el hash de la URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (!error) {
            setIsValidSession(true)
          }
        }
      }
      setCheckingSession(false)
    }

    checkSession()
  }, [supabase.auth])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    // Validaciones
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        throw error
      }

      setMessage('¡Contraseña actualizada correctamente!')
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch (err) {
      setError(err.message || 'Error al actualizar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  // Mientras verifica la sesión
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-[#0A3D5C] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando enlace...</p>
        </div>
      </div>
    )
  }

  // Si no hay sesión válida
  if (!isValidSession) {
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
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-[#0A3D5C] mb-2">
              Enlace inválido o expirado
            </h1>
            <p className="text-gray-500 mb-6">
              El enlace de recuperación no es válido o ha expirado. Por favor, solicita uno nuevo.
            </p>
            <Link 
              href="/auth/forgot-password"
              className="inline-block w-full py-3 px-4 bg-[#0A3D5C] text-white font-semibold rounded-xl hover:bg-[#0A3D5C]/90 transition-all text-center"
            >
              Solicitar nuevo enlace
            </Link>
            <div className="mt-4">
              <Link 
                href="/auth/login" 
                className="text-[#0A3D5C] hover:underline font-medium"
              >
                ← Volver al inicio de sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
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
            Nueva contraseña
          </h1>
          <p className="text-gray-500 text-center mb-6">
            Introduce tu nueva contraseña
          </p>

          {/* Success Message */}
          {message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✅</span>
                <div>
                  <p className="text-green-700 text-sm">{message}</p>
                  <p className="text-green-600 text-xs mt-1">Redirigiendo al login...</p>
                </div>
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
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0A3D5C] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar contraseña
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repite la contraseña"
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
                    Actualizando...
                  </>
                ) : (
                  <>
                    🔐 Actualizar contraseña
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          © 2025 LexAduana. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}

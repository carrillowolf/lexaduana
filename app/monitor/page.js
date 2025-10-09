'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

export default function MonitorAuth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error
        
        // Redirigir al dashboard
        window.location.href = '/monitor/dashboard'
        
      } else {
        // Registro
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              company_name: companyName,
            },
            emailRedirectTo: `${window.location.origin}/monitor/dashboard`
          }
        })
        
        if (error) throw error
        
        // Crear perfil de usuario
        if (data.user) {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: data.user.id,
              email: email,
              company_name: companyName,
              plan_type: 'free',
              max_monitors: 5
            })
            
          if (profileError) console.error('Error creating profile:', profileError)
        }
        
        setMessage({
          type: 'success',
          text: '¡Registro exitoso! Revisa tu email para confirmar tu cuenta.'
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Error en la autenticación'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl">
              <Image src="/logo.png" alt="Lex Aduana" width={60} height={60} />
            </div>
          </div>
          
          {/* Título */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Monitor de Aranceles
            </h1>
            <p className="text-gray-600 mt-2">
              {isLogin ? 'Accede a tu cuenta' : 'Crea tu cuenta gratis'}
            </p>
          </div>

          {/* Toggle Login/Registro */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md transition-all ${
                isLogin 
                  ? 'bg-white shadow-sm text-gray-900 font-medium' 
                  : 'text-gray-600'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md transition-all ${
                !isLogin 
                  ? 'bg-white shadow-sm text-gray-900 font-medium' 
                  : 'text-gray-600'
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Empresa
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nombre de tu empresa"
                  required={!isLogin}
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="tu@email.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
                minLength={6}
              />
              {!isLogin && (
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 6 caracteres
                </p>
              )}
            </div>

            {/* Mensaje */}
            {message.text && (
              <div className={`p-3 rounded-lg text-sm ${
                message.type === 'error' 
                  ? 'bg-red-50 text-red-700 border border-red-200' 
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {message.text}
              </div>
            )}

            {/* Botón submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  {isLogin ? 'Accediendo...' : 'Registrando...'}
                </span>
              ) : (
                isLogin ? 'Acceder' : 'Crear cuenta'
              )}
            </button>
          </form>

          {/* Features del plan free */}
          {!isLogin && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                Plan gratuito incluye:
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>✓ Monitorización de hasta 5 códigos HS</li>
                <li>✓ Alertas por email</li>
                <li>✓ Historial de cambios</li>
                <li>✓ Dashboard personalizado</li>
              </ul>
            </div>
          )}

          {/* Link volver */}
          <div className="mt-6 text-center">
            <a 
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Volver a la calculadora
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

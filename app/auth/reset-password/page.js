'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { authDict } from '@/lib/i18n/auth'
import LanguageSwitcher from '@/components/LanguageSwitcher'

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
  const t = useTranslation(authDict)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        setIsValidSession(true)
      } else {
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

    if (password.length < 6) {
      setError(t('resetPassword.passwordTooShort'))
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError(t('resetPassword.passwordMismatch'))
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

      setMessage(t('resetPassword.success'))

      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch (err) {
      setError(err.message || t('resetPassword.errorFallback'))
    } finally {
      setLoading(false)
    }
  }

  // Checking session state
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#060d16] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-[#F4C542] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/50">{t('resetPassword.checking')}</p>
        </div>
      </div>
    )
  }

  // Invalid session state
  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-[#060d16] flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-[#0A3D5C]/20 rounded-full blur-[150px] pointer-events-none" />

        {/* Language switcher */}
        <div className="absolute top-6 right-6 z-20">
          <LanguageSwitcher />
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-10">
            <Link href="/" className="inline-flex items-center gap-3">
              <img src="/logo.png" alt="LexAduana" className="h-10 w-10 rounded-lg bg-white p-0.5" />
              <span className="text-2xl font-bold text-white tracking-tight">LexAduana</span>
            </Link>
          </div>

          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 backdrop-blur-xl text-center">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {t('resetPassword.invalidTitle')}
            </h1>
            <p className="text-white/50 text-sm mb-6">
              {t('resetPassword.invalidDesc')}
            </p>
            <Link
              href="/auth/forgot-password"
              className="inline-block w-full py-3 px-4 bg-[#F4C542] text-[#060d16] font-semibold rounded-xl hover:bg-[#F4C542]/90 transition-all text-center"
            >
              {t('resetPassword.requestNew')}
            </Link>
            <div className="mt-4">
              <Link
                href="/auth/login"
                className="text-sm text-white/40 hover:text-white/60 transition-colors"
              >
                {t('resetPassword.backToLogin')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Valid session - show reset form
  return (
    <div className="min-h-screen bg-[#060d16] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-[#0A3D5C]/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-[#F4C542]/8 rounded-full blur-[150px] pointer-events-none" />

      {/* Language switcher */}
      <div className="absolute top-6 right-6 z-20">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <img src="/logo.png" alt="LexAduana" className="h-10 w-10 rounded-lg bg-white p-0.5" />
            <span className="text-2xl font-bold text-white tracking-tight">LexAduana</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 backdrop-blur-xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              {t('resetPassword.title')}
            </h1>
            <p className="text-white/50 text-sm">{t('resetPassword.subtitle')}</p>
          </div>

          {message && (
            <div className="mb-5 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div>
                <p className="text-sm text-emerald-400">{message}</p>
                <p className="text-xs text-emerald-400/60 mt-1">{t('resetPassword.redirecting')}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {!message && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/60 mb-2">
                  {t('resetPassword.password')}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder={t('resetPassword.passwordPlaceholder')}
                  className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-[#F4C542]/50 focus:border-[#F4C542]/50 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/60 mb-2">
                  {t('resetPassword.confirmPassword')}
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder={t('resetPassword.confirmPlaceholder')}
                  className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-[#F4C542]/50 focus:border-[#F4C542]/50 focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#F4C542] text-[#060d16] font-semibold py-3 px-6 rounded-xl hover:bg-[#F4C542]/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('resetPassword.submitting')}
                  </>
                ) : (
                  t('resetPassword.submit')
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-white/20 text-sm mt-6">
          {t('resetPassword.copyright')}
        </p>
      </div>
    </div>
  )
}

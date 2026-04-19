'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { authDict } from '@/lib/i18n/auth'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { safeInternalRedirect } from '@/lib/auth/safeRedirect'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  )
}

function LoginPageInner() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const t = useTranslation(authDict)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      setMessage(t('login.success'))
      const next = safeInternalRedirect(searchParams.get('next'), '/calculadora')
      router.push(next)
      router.refresh()
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#060d16] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-[#0A3D5C]/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-[#F4C542]/8 rounded-full blur-[150px] pointer-events-none" />

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

        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 backdrop-blur-xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              {t('login.title')}
            </h1>
            <p className="text-white/50 text-sm">{t('login.subtitle')}</p>
          </div>

          {error && (
            <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {message && (
            <div className="mb-5 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <p className="text-sm text-emerald-400">{message}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-white/60 mb-2">
                {t('login.email')}
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-[#F4C542]/50 focus:border-[#F4C542]/50 focus:outline-none transition-all"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="login-password" className="block text-sm font-medium text-white/60">
                  {t('login.password')}
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-[#F4C542]/70 hover:text-[#F4C542] transition-colors"
                >
                  {t('login.forgotPassword')}
                </Link>
              </div>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-[#F4C542]/50 focus:border-[#F4C542]/50 focus:outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F4C542] text-[#060d16] font-semibold py-3 px-6 rounded-xl hover:bg-[#F4C542]/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('login.submitting') : t('login.submit')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-white/40">
              {t('login.noAccount')}{' '}
              <Link href="/auth/register" className="text-[#F4C542] hover:text-[#F4C542]/80 font-medium transition-colors">
                {t('login.createAccount')}
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-white/30 hover:text-white/50 transition-colors">
            {t('login.back')}
          </Link>
        </div>
      </div>
    </div>
  )
}

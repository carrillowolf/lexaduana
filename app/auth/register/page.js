'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { authDict } from '@/lib/i18n/auth'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { safeInternalRedirect } from '@/lib/auth/safeRedirect'

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageInner />
    </Suspense>
  )
}

function RegisterPageInner() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const t = useTranslation(authDict)
  const nextParam = safeInternalRedirect(searchParams.get('next'), null)
  const loginHref = nextParam ? `/auth/login?next=${encodeURIComponent(nextParam)}` : '/auth/login'

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (password !== confirmPassword) {
      setError(t('register.passwordMismatch'))
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError(t('register.passwordTooShort'))
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setMessage(t('register.success'))
      setTimeout(() => {
        router.push(loginHref)
      }, 3000)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#060d16] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] bg-[#0A3D5C]/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] bg-[#F4C542]/8 rounded-full blur-[150px] pointer-events-none" />

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
              {t('register.title')}
            </h1>
            <p className="text-white/50 text-sm">{t('register.subtitle')}</p>
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

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                {t('register.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-[#F4C542]/50 focus:border-[#F4C542]/50 focus:outline-none transition-all"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                {t('register.password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-[#F4C542]/50 focus:border-[#F4C542]/50 focus:outline-none transition-all"
                placeholder="••••••••"
                required
              />
              <p className="mt-1.5 text-xs text-white/30">{t('register.passwordHint')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                {t('register.confirmPassword')}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? t('register.submitting') : t('register.submit')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-white/40">
              {t('register.hasAccount')}{' '}
              <Link href={loginHref} className="text-[#F4C542] hover:text-[#F4C542]/80 font-medium transition-colors">
                {t('register.signIn')}
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-white/30 hover:text-white/50 transition-colors">
            {t('register.back')}
          </Link>
        </div>
      </div>
    </div>
  )
}

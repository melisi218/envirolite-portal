import { useState } from 'react'
import { supabase } from '../lib/supabase'

const ALLOWED_DOMAIN = 'envirolite.com'

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function checkDomain(email) {
    if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
      setError(`Only @${ALLOWED_DOMAIN} accounts can sign up.`)
      return false
    }
    return true
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleSignUp(e) {
    e.preventDefault()
    if (!checkDomain(email)) return
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    else setMessage('Check your email to confirm your account.')
    setLoading(false)
  }

  async function handleForgot(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) setError(error.message)
    else setMessage('Check your email for a reset link.')
    setLoading(false)
  }

  const switchMode = (next) => { setMode(next); setError(''); setMessage('') }

  const inputClass = "w-full bg-white/10 text-white placeholder-white/40 rounded-2xl px-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-brand-blue"

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-navy px-4"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>

      {/* Logo */}
      <div className="text-center mb-12">
        <div className="text-white text-4xl font-light tracking-[0.2em] mb-1">ENVIROLITE</div>
        <div className="text-brand-blue text-xs font-medium tracking-[0.4em] uppercase">Portal</div>
      </div>

      {mode === 'login' && (
        <form onSubmit={handleLogin} className="w-full space-y-3">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            required autoComplete="email" className={inputClass} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            required autoComplete="current-password" className={inputClass} />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-brand-blue text-white rounded-2xl py-4 text-base font-semibold active:opacity-80 disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <div className="flex justify-between pt-1">
            <button type="button" onClick={() => switchMode('signup')} className="text-white/40 text-sm py-2">
              Create account
            </button>
            <button type="button" onClick={() => switchMode('forgot')} className="text-white/40 text-sm py-2">
              Forgot password?
            </button>
          </div>
        </form>
      )}

      {mode === 'signup' && (
        <form onSubmit={handleSignUp} className="w-full space-y-3">
          <p className="text-white/50 text-xs text-center mb-1">@{ALLOWED_DOMAIN} accounts only</p>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            required autoComplete="email" className={inputClass} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            required autoComplete="new-password" className={inputClass} />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          {message && <p className="text-green-400 text-sm text-center">{message}</p>}
          {!message && (
            <button type="submit" disabled={loading}
              className="w-full bg-brand-blue text-white rounded-2xl py-4 text-base font-semibold active:opacity-80 disabled:opacity-50">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          )}
          <button type="button" onClick={() => switchMode('login')} className="w-full text-white/40 text-sm text-center py-2">
            Back to sign in
          </button>
        </form>
      )}

      {mode === 'forgot' && (
        <form onSubmit={handleForgot} className="w-full space-y-3">
          <p className="text-white/60 text-sm text-center mb-2">Enter your email and we'll send a reset link.</p>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            required autoComplete="email" className={inputClass} />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          {message && <p className="text-green-400 text-sm text-center">{message}</p>}
          {!message && (
            <button type="submit" disabled={loading}
              className="w-full bg-brand-blue text-white rounded-2xl py-4 text-base font-semibold active:opacity-80 disabled:opacity-50">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          )}
          <button type="button" onClick={() => switchMode('login')} className="w-full text-white/40 text-sm text-center py-2">
            Back to sign in
          </button>
        </form>
      )}

      <p className="text-white/20 text-xs mt-12">Internal use only</p>
    </div>
  )
}

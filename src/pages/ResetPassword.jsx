import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ResetPassword({ onDone }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleReset(e) {
    e.preventDefault()
    if (password !== confirm) { setError("Passwords don't match"); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setError(error.message)
    else onDone()
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-navy px-6"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>

      <div className="text-center mb-12">
        <div className="text-white text-4xl font-light tracking-[0.2em] mb-1">ENVIROLITE</div>
        <div className="text-brand-blue text-xs font-medium tracking-[0.4em] uppercase">Portal</div>
      </div>

      <form onSubmit={handleReset} className="w-full max-w-xs space-y-3">
        <p className="text-white/60 text-sm text-center mb-2">Set a new password.</p>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          className="w-full bg-white/10 text-white placeholder-white/40 rounded-2xl px-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-brand-blue"
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
          className="w-full bg-white/10 text-white placeholder-white/40 rounded-2xl px-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-brand-blue"
        />
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-brand-blue text-white rounded-2xl py-4 text-base font-semibold active:opacity-80 disabled:opacity-50">
          {loading ? 'Saving...' : 'Set New Password'}
        </button>
      </form>
    </div>
  )
}

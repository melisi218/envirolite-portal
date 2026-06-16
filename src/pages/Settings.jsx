import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { LogOut, ChevronRight, Info, Building2, User, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Settings() {
  const [user, setUser] = useState(null)
  const [name, setName] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameMsg, setNameMsg] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState('')
  const [pwError, setPwError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUser(user)
      setName(user.user_metadata?.full_name || '')
    })
  }, [])

  async function saveName(e) {
    e.preventDefault()
    setNameSaving(true)
    setNameMsg('')
    const { error } = await supabase.auth.updateUser({ data: { full_name: name } })
    setNameSaving(false)
    setNameMsg(error ? error.message : 'Name updated.')
  }

  async function savePassword(e) {
    e.preventDefault()
    setPwError('')
    setPwMsg('')
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.')
      return
    }
    if (newPassword.length < 6) {
      setPwError('Password must be at least 6 characters.')
      return
    }
    setPwSaving(true)
    // Re-authenticate first to verify current password
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })
    if (signInErr) {
      setPwError('Current password is incorrect.')
      setPwSaving(false)
      return
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwSaving(false)
    if (error) setPwError(error.message)
    else {
      setPwMsg('Password updated.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white"

  return (
    <div>
      <div className="bg-brand-navy px-5 pt-4 pb-5">
        <h1 className="text-white text-2xl font-semibold">Settings</h1>
        {user?.email && <p className="text-white/40 text-sm mt-0.5">{user.email}</p>}
      </div>

      <div className="px-4 pt-4 space-y-4 pb-10">

        {/* Account Info */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-brand-navy/5 flex items-center justify-center">
              <User size={15} className="text-brand-navy" />
            </div>
            <span className="text-sm font-semibold text-brand-navy">Account Info</span>
          </div>
          <form onSubmit={saveName} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</label>
              <input
                value={name}
                onChange={e => { setName(e.target.value); setNameMsg('') }}
                placeholder="Your name"
                className={`${inputClass} mt-1.5`}
              />
            </div>
            {nameMsg && <p className="text-xs text-green-500">{nameMsg}</p>}
            <button type="submit" disabled={nameSaving}
              className="w-full bg-brand-blue text-white rounded-2xl py-4 text-base font-semibold active:opacity-80 disabled:opacity-50">
              {nameSaving ? 'Saving...' : 'Save Name'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-brand-navy/5 flex items-center justify-center">
              <Lock size={15} className="text-brand-navy" />
            </div>
            <span className="text-sm font-semibold text-brand-navy">Change Password</span>
          </div>
          <form onSubmit={savePassword} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => { setCurrentPassword(e.target.value); setPwError(''); setPwMsg('') }}
                placeholder="Current password"
                autoComplete="current-password"
                className={`${inputClass} mt-1.5`}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setPwError(''); setPwMsg('') }}
                placeholder="New password"
                autoComplete="new-password"
                className={`${inputClass} mt-1.5`}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setPwError(''); setPwMsg('') }}
                placeholder="Confirm new password"
                autoComplete="new-password"
                className={`${inputClass} mt-1.5`}
              />
            </div>
            {pwError && <p className="text-xs text-red-400">{pwError}</p>}
            {pwMsg && <p className="text-xs text-green-500">{pwMsg}</p>}
            <button type="submit" disabled={pwSaving}
              className="w-full bg-brand-blue text-white rounded-2xl py-4 text-base font-semibold active:opacity-80 disabled:opacity-50">
              {pwSaving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Manage Buyers */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <Link to="/companies" className="flex items-center px-4 py-4 active:bg-gray-50">
            <div className="w-9 h-9 rounded-xl bg-brand-navy/5 flex items-center justify-center mr-3">
              <Building2 size={16} className="text-brand-navy" />
            </div>
            <span className="text-sm font-medium text-brand-navy flex-1">Manage Buyers</span>
            <ChevronRight size={16} className="text-gray-300" />
          </Link>
        </div>

        {/* Sign Out */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <button onClick={() => supabase.auth.signOut()}
            className="w-full flex items-center px-4 py-4 active:bg-gray-50">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center mr-3">
              <LogOut size={16} className="text-red-500" />
            </div>
            <span className="text-sm font-medium text-red-500 flex-1 text-left">Sign Out</span>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
        </div>

        {/* Version */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center px-4 py-4">
            <div className="w-9 h-9 rounded-xl bg-brand-navy/5 flex items-center justify-center mr-3">
              <Info size={16} className="text-brand-navy" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-brand-navy">Envirolite Portal</div>
              <div className="text-xs text-gray-400 mt-0.5">Version 1.0.0</div>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center px-4">
          Internal use only. Contact your administrator to add or manage users.
        </p>
      </div>
    </div>
  )
}

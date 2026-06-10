import { supabase } from '../lib/supabase'
import { LogOut, ChevronRight, Info, Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Settings() {
  const handleSignOut = () => supabase.auth.signOut()

  return (
    <div>
      <div className="bg-brand-navy px-5 pt-4 pb-5">
        <h1 className="text-white text-2xl font-semibold">Settings</h1>
      </div>

      <div className="px-4 pt-4 space-y-4">

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
          <Link to="/companies" className="flex items-center px-4 py-4 active:bg-gray-50">
            <div className="w-9 h-9 rounded-xl bg-brand-navy/5 flex items-center justify-center mr-3">
              <Building2 size={16} className="text-brand-navy" />
            </div>
            <span className="text-sm font-medium text-brand-navy flex-1">Manage Buyers</span>
            <ChevronRight size={16} className="text-gray-300" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
          <button onClick={handleSignOut}
            className="w-full flex items-center px-4 py-4 active:bg-gray-50">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center mr-3">
              <LogOut size={16} className="text-red-500" />
            </div>
            <span className="text-sm font-medium text-red-500 flex-1 text-left">Sign Out</span>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
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

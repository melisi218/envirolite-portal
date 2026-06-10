import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, ChevronRight, Plus, Building2 } from 'lucide-react'
import Sheet from '../components/Sheet'

export default function Companies() {
  const navigate = useNavigate()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('companies').select('*, requests(count)').order('name')
    setCompanies(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function addCompany(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    await supabase.from('companies').insert({ name: newName.trim() })
    setNewName(''); setShowAdd(false); setSaving(false)
    load()
  }

  return (
    <div className="min-h-screen bg-brand-light">
      {/* Header */}
      <div className="bg-brand-navy px-5 pt-4 pb-5 flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 flex-shrink-0">
          <ArrowLeft size={18} className="text-white" />
        </button>
        <h1 className="text-white text-xl font-semibold flex-1">Manage Buyers</h1>
        <button onClick={() => setShowAdd(true)}
          className="w-9 h-9 rounded-full bg-brand-blue flex items-center justify-center active:opacity-80">
          <Plus size={18} className="text-white" />
        </button>
      </div>

      <div className="px-4 pt-4">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
            {companies.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">No buyers yet</div>
            ) : companies.map(c => (
              <Link key={c.id} to={`/companies/${c.id}`}
                className="flex items-center px-4 py-4 active:bg-gray-50">
                <div className="w-10 h-10 rounded-xl bg-brand-navy/5 flex items-center justify-center mr-3 flex-shrink-0">
                  <Building2 size={18} className="text-brand-navy" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-brand-navy">{c.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {c.requests?.[0]?.count ?? 0} request{c.requests?.[0]?.count !== 1 ? 's' : ''}
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </Link>
            ))}
          </div>
        )}
      </div>

      <Sheet open={showAdd} onClose={() => setShowAdd(false)} title="Add Buyer">
        <form onSubmit={addCompany} className="px-5 py-4">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Buyer Name</label>
          <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="e.g. Cardinal Health"
            className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-blue" />
          <button type="submit" disabled={saving}
            className="w-full mt-4 bg-brand-blue text-white rounded-xl py-3.5 text-base font-semibold active:opacity-80 disabled:opacity-50">
            {saving ? 'Adding...' : 'Add Buyer'}
          </button>
        </form>
      </Sheet>
    </div>
  )
}

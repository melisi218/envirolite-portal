import { useEffect, useState, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ChevronRight, Plus, ChevronDown, Check } from 'lucide-react'

const STATUS_COLORS = {
  'In Progress': 'bg-blue-100 text-blue-600',
  'On Hold': 'bg-yellow-100 text-yellow-600',
  'Completed': 'bg-green-100 text-green-600',
  'Cancelled': 'bg-gray-100 text-gray-400',
}

const FILTERS = ['All', 'In Progress', 'On Hold', 'Completed', 'Cancelled']

export default function Requests() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedBuyers, setSelectedBuyers] = useState([]) // array of company ids
  const [buyerOpen, setBuyerOpen] = useState(false)
  const buyerRef = useRef()

  async function load() {
    const [{ data: reqs }, { data: cos }] = await Promise.all([
      supabase.from('requests').select('*, companies(name)').order('created_at', { ascending: true }),
      supabase.from('companies').select('id, name').order('name'),
    ])
    setRequests(reqs || [])
    setCompanies(cos || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!buyerOpen) return
    function handleClick(e) {
      if (buyerRef.current && !buyerRef.current.contains(e.target)) {
        setBuyerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [buyerOpen])

  function toggleBuyer(id) {
    setSelectedBuyers(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    )
  }

  const filtered = useMemo(() => {
    let result = activeFilter === 'All' ? requests : requests.filter(r => r.status === activeFilter)
    if (selectedBuyers.length > 0) {
      result = result.filter(r => selectedBuyers.includes(r.company_id))
    }
    return result
  }, [requests, activeFilter, selectedBuyers])

  return (
    <div>
      <div className="bg-brand-navy px-5 pt-4 pb-5 relative flex items-center justify-center">
        <h1 className="text-white text-xl font-semibold">Project Requests</h1>
        <button onClick={() => navigate('/requests/new')}
          className="absolute right-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center active:opacity-80">
          <Plus size={20} className="text-white" />
        </button>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto no-scrollbar">

        {/* Buyer dropdown */}
        <div className="relative flex-shrink-0" ref={buyerRef}>
          <button
            onClick={() => setBuyerOpen(o => !o)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              selectedBuyers.length > 0
                ? 'bg-brand-navy text-white border-brand-navy'
                : 'bg-white text-gray-500 border-gray-200'
            }`}
          >
            Buyer
            {selectedBuyers.length > 0 && (
              <span className="bg-white/20 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                {selectedBuyers.length}
              </span>
            )}
            <ChevronDown size={12} className={selectedBuyers.length > 0 ? 'text-white/70' : 'text-gray-400'} />
          </button>

          {buyerOpen && (
            <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
              {/* Clear all */}
              {selectedBuyers.length > 0 && (
                <button
                  onClick={() => setSelectedBuyers([])}
                  className="w-full text-left px-4 py-2.5 text-xs text-brand-blue font-semibold border-b border-gray-50"
                >
                  Clear all
                </button>
              )}
              <div className="max-h-64 overflow-y-auto">
                {companies.map(c => {
                  const checked = selectedBuyers.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleBuyer(c.id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm text-left text-gray-700 active:bg-gray-50 border-b border-gray-50 last:border-0"
                    >
                      <span className={checked ? 'font-medium text-brand-navy' : ''}>{c.name}</span>
                      {checked && (
                        <span className="w-5 h-5 rounded-full bg-brand-blue flex items-center justify-center flex-shrink-0">
                          <Check size={11} className="text-white" />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Status pills */}
        {FILTERS.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeFilter === f
                ? 'bg-brand-navy text-white'
                : 'bg-white text-gray-500 border border-gray-200'
            }`}>
            {f}
          </button>
        ))}
      </div>

      <div className="px-4 pb-4">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm" />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">No requests</div>
            ) : filtered.map(req => (
              <Link key={req.id} to={`/requests/${req.id}`}
                className="flex items-center px-4 py-4 active:bg-gray-50">
                <div className="flex-1 min-w-0 mr-3">
                  <div className="text-sm font-medium text-brand-navy truncate">{req.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{req.companies?.name} · {new Date(req.created_at).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[req.status]}`}>
                    {req.status}
                  </span>
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

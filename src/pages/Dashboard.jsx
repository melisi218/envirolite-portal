import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ChevronRight, Plus } from 'lucide-react'

const STATUS_COLORS = {
  'In Progress': 'bg-blue-100 text-blue-600',
  'On Hold': 'bg-yellow-100 text-yellow-600',
  'Completed': 'bg-green-100 text-green-600',
  'Cancelled': 'bg-gray-100 text-gray-400',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCompany, setActiveCompany] = useState(null)

  useEffect(() => {
    async function load() {
      const [{ data: reqs }, { data: cos }] = await Promise.all([
        supabase.from('requests').select('*, companies(name)').order('created_at', { ascending: true }),
        supabase.from('companies').select('id, name').order('name'),
      ])
      setRequests(reqs || [])
      setCompanies(cos || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() =>
    activeCompany ? requests.filter(r => r.company_id === activeCompany) : requests,
    [requests, activeCompany]
  )

  return (
    <div>
      {/* Header */}
      <div className="bg-brand-navy px-5 pt-4 pb-6">
        <img src="/envirolite-logo.svg" alt="Envirolite" className="h-8" />
      </div>


      {/* Recent Requests */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-3 px-4">
          <h2 className="text-sm font-semibold text-brand-navy uppercase tracking-wide">Open Projects</h2>
          <Link to="/requests" className="text-brand-blue text-sm">See all</Link>
        </div>

        {/* Company filter pills */}
        {!loading && companies.length > 0 && (
          <div className="flex gap-2 overflow-x-auto px-4 pb-3 no-scrollbar">
            <button
              onClick={() => setActiveCompany(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeCompany === null
                  ? 'bg-brand-navy text-white'
                  : 'bg-white text-gray-500 border border-gray-200'
              }`}
            >
              All
            </button>
            {companies.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCompany(activeCompany === c.id ? null : c.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeCompany === c.id
                    ? 'bg-brand-navy text-white'
                    : 'bg-white text-gray-500 border border-gray-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        <div className="px-4">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
            {loading ? (
              <div className="py-10 text-center text-gray-400 text-sm" />
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">No Current Requests</div>
            ) : (
              filtered.map(req => (
                <Link key={req.id} to={`/requests/${req.id}`}
                  className="flex items-center px-4 py-3.5 active:bg-gray-50">
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="text-sm font-medium text-brand-navy truncate">{req.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{req.companies?.name}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[req.status]}`}>
                      {req.status}
                    </span>
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Add New Project button */}
        <div className="px-4 mt-3">
          <button
            onClick={() => navigate('/requests/new')}
            className="w-full flex items-center justify-center gap-2 bg-brand-blue text-white rounded-2xl py-4 text-base font-semibold active:opacity-80"
          >
            <Plus size={16} />
            Add New Project
          </button>
        </div>
      </div>
      <div className="h-6" />
    </div>
  )
}

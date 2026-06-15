import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ChevronRight } from 'lucide-react'

const STATUS_COLORS = {
  'In Progress': 'bg-blue-100 text-blue-600',
  'On Hold': 'bg-yellow-100 text-yellow-600',
  'Completed': 'bg-green-100 text-green-600',
  'Cancelled': 'bg-gray-100 text-gray-400',
}

export default function Dashboard() {
  const [stats, setStats] = useState({ companies: 0, requests: 0, products: 0 })
  const [requests, setRequests] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCompany, setActiveCompany] = useState(null)

  useEffect(() => {
    async function load() {
      const [{ count: c }, { count: r }, { count: p }, { data: reqs }, { data: cos }] = await Promise.all([
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('requests').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('requests').select('*, companies(name)').order('created_at', { ascending: true }),
        supabase.from('companies').select('id, name').order('name'),
      ])
      setStats({ companies: c || 0, requests: r || 0, products: p || 0 })
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

      {/* Stats */}
      <div className="px-4 -mt-3">
        <div className="bg-white rounded-2xl shadow-sm p-4 grid grid-cols-3 divide-x divide-gray-100">
          {[
            { label: 'New Requests', value: stats.companies },
            { label: 'In-Progress', value: stats.requests },
            { label: 'Products', value: stats.products },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center py-1">
              <div className="text-2xl font-semibold text-brand-navy">{loading ? '—' : value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Requests */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-3 px-4">
          <h2 className="text-sm font-semibold text-brand-navy uppercase tracking-wide">Recent Requests</h2>
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
      </div>
      <div className="h-6" />
    </div>
  )
}

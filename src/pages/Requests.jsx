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

const FILTERS = ['All', 'In Progress', 'On Hold', 'Completed', 'Cancelled']

export default function Requests() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('All')

  async function load() {
    const { data } = await supabase.from('requests').select('*, companies(name)').order('created_at', { ascending: true })
    setRequests(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() =>
    activeFilter === 'All' ? requests : requests.filter(r => r.status === activeFilter),
    [requests, activeFilter]
  )

  return (
    <div>
      <div className="bg-brand-navy px-5 pt-4 pb-5 relative flex items-center justify-center">
        <h1 className="text-white text-xl font-semibold">Project Requests</h1>
        <button onClick={() => navigate('/requests/new')}
          className="absolute right-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center active:opacity-80">
          <Plus size={20} className="text-white" />
        </button>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
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

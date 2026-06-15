import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ChevronLeft, Plus, ChevronRight, ChevronDown, Edit2, Check } from 'lucide-react'

const STATUS_COLORS = {
  'In Progress': 'bg-blue-100 text-blue-600',
  'On Hold': 'bg-yellow-100 text-yellow-600',
  'Completed': 'bg-green-100 text-green-600',
  'Cancelled': 'bg-gray-100 text-gray-400',
}
const STATUSES = ['In Progress', 'On Hold', 'Completed', 'Cancelled']

export default function RequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)
  const [products, setProducts] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)

  async function load() {
    const [{ data: req }, { data: prods }, { data: cos }] = await Promise.all([
      supabase.from('requests').select('*, companies(name)').eq('id', id).single(),
      supabase.from('products').select('*').eq('request_id', id).order('created_at'),
      supabase.from('companies').select('id, name').order('name'),
    ])
    setRequest(req)
    setProducts(prods || [])
    setCompanies(cos || [])
    if (req) setEditForm({ title: req.title, notes: req.notes || '', company_id: req.company_id, status: req.status })
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function updateStatus(status) {
    await supabase.from('requests').update({ status }).eq('id', id)
    setRequest(r => ({ ...r, status }))
  }

  async function saveEdit() {
    setSaving(true)
    await supabase.from('requests').update({
      title: editForm.title,
      notes: editForm.notes,
      company_id: editForm.company_id,
      status: editForm.status,
    }).eq('id', id)
    await load()
    setEditing(false)
    setSaving(false)
  }

  function cancelEdit() {
    setEditForm({ title: request.title, notes: request.notes || '', company_id: request.company_id, status: request.status })
    setEditing(false)
  }

  if (loading) return <div className="py-20 text-center text-gray-400">Loading...</div>
  if (!request) return <div className="py-20 text-center text-gray-400">Not found</div>

  return (
    <div>
      {/* Header */}
      <div className="bg-brand-navy px-5 pt-4 pb-5">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-brand-blue text-sm active:opacity-70">
            <ChevronLeft size={16} /> Requests
          </button>
          {!editing ? (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-brand-blue text-sm active:opacity-70">
              <Edit2 size={14} /> Edit
            </button>
          ) : (
            <div className="flex gap-3">
              <button onClick={cancelEdit} className="text-white/50 text-sm">Cancel</button>
              <button onClick={saveEdit} disabled={saving}
                className="flex items-center gap-1 text-brand-blue text-sm font-semibold disabled:opacity-50">
                <Check size={14} /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            {/* Company */}
            <div className="relative">
              <select value={editForm.company_id} onChange={e => setEditForm(f => ({ ...f, company_id: e.target.value }))}
                className="w-full appearance-none bg-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none border border-white/20 pr-8">
                {companies.map(c => <option key={c.id} value={c.id} className="text-black">{c.name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            </div>
            {/* Title */}
            <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
              className="w-full bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-2.5 text-base font-semibold focus:outline-none border border-white/20"
              placeholder="Project Name" />
            {/* Notes */}
            <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
              rows={3} placeholder="Notes..."
              className="w-full bg-white/10 text-white/80 placeholder-white/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none border border-white/20 resize-none" />
            {/* Status */}
            <div className="relative inline-block">
              <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                className={`appearance-none text-xs font-semibold px-3 py-1.5 rounded-full pr-7 focus:outline-none cursor-pointer ${STATUS_COLORS[editForm.status]}`}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
            </div>
          </div>
        ) : (
          <>
            <div className="text-brand-blue text-xs font-medium tracking-widest uppercase mb-1">{request.companies?.name}</div>
            <h1 className="text-white text-xl font-semibold leading-tight">{request.title}</h1>
            {request.notes && <p className="text-white/50 text-sm mt-1">{request.notes}</p>}
            <div className="mt-3 relative inline-block">
              <select value={request.status} onChange={e => updateStatus(e.target.value)}
                className={`appearance-none text-xs font-semibold px-3 py-1.5 rounded-full pr-7 focus:outline-none cursor-pointer ${STATUS_COLORS[request.status]}`}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
            </div>
          </>
        )}
      </div>

      {/* Products */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-brand-navy uppercase tracking-wide">
            Products ({products.length})
          </h2>
          <button onClick={() => navigate(`/products/new?request_id=${id}`)}
            className="flex items-center gap-1.5 text-sm font-medium text-brand-blue active:opacity-70">
            <Plus size={16} /> Add Product
          </button>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-2xl py-12 text-center shadow-sm">
            <p className="text-gray-400 text-sm">No products yet</p>
            <button onClick={() => navigate(`/products/new?request_id=${id}`)}
              className="mt-3 text-brand-blue text-sm font-medium active:opacity-70">
              Add the first product →
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
            {products.map(p => (
              <Link key={p.id} to={`/products/${p.id}`} className="flex items-center px-4 py-4 active:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-brand-navy">{p.name}</div>
                    {p.is_draft && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Draft</span>
                    )}
                  </div>
                  {p.assigned_to && <div className="text-xs text-gray-400 mt-0.5">Assigned: {p.assigned_to}</div>}
                </div>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0 ml-2" />
              </Link>
            ))}
          </div>
        )}
        <div className="h-4" />
      </div>
    </div>
  )
}

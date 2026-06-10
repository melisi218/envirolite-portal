import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ChevronLeft, Plus, ChevronRight, ChevronDown } from 'lucide-react'
import Sheet from '../components/Sheet'

const STATUS_COLORS = {
  'In Progress': 'bg-blue-100 text-blue-600',
  'On Hold': 'bg-yellow-100 text-yellow-600',
  'Completed': 'bg-green-100 text-green-600',
  'Cancelled': 'bg-gray-100 text-gray-400',
}
const STATUSES = ['In Progress', 'On Hold', 'Completed', 'Cancelled']

const BLANK = { name:'',sku:'',box_length_in:'',box_width_in:'',box_height_in:'',pieces_per_unit:'',units_per_case:'',cases_per_pallet:'',unit_weight_lbs:'',case_weight_lbs:'',pallet_pattern:'',notes:'' }

export default function RequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)

  async function load() {
    const [{ data: req }, { data: prods }] = await Promise.all([
      supabase.from('requests').select('*, companies(name)').eq('id', id).single(),
      supabase.from('products').select('*').eq('request_id', id).order('created_at'),
    ])
    setRequest(req); setProducts(prods || []); setLoading(false)
  }
  useEffect(() => { load() }, [id])

  async function updateStatus(status) {
    await supabase.from('requests').update({ status }).eq('id', id)
    setRequest(r => ({ ...r, status }))
  }

  async function addProduct(e) {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, request_id: id }
    Object.keys(payload).forEach(k => { if (payload[k] === '') payload[k] = null })
    await supabase.from('products').insert(payload)
    setForm(BLANK); setShowAdd(false); setSaving(false)
    load()
  }

  const f = v => (v !== null && v !== undefined && v !== '') ? v : '—'

  if (loading) return <div className="py-20 text-center text-gray-400">Loading...</div>
  if (!request) return <div className="py-20 text-center text-gray-400">Not found</div>

  return (
    <div>
      {/* Header */}
      <div className="bg-brand-navy px-5 pt-4 pb-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-brand-blue text-sm mb-3 active:opacity-70">
          <ChevronLeft size={16} /> Requests
        </button>
        <div className="text-brand-blue text-xs font-medium tracking-widest uppercase mb-1">{request.companies?.name}</div>
        <h1 className="text-white text-xl font-semibold leading-tight">{request.title}</h1>
        {request.description && <p className="text-white/50 text-sm mt-1">{request.description}</p>}

        {/* Status picker */}
        <div className="mt-3 relative inline-block">
          <select value={request.status} onChange={e => updateStatus(e.target.value)}
            className={`appearance-none text-xs font-semibold px-3 py-1.5 rounded-full pr-7 focus:outline-none cursor-pointer ${STATUS_COLORS[request.status]}`}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
        </div>
      </div>

      {/* Products */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-brand-navy uppercase tracking-wide">
            Products ({products.length})
          </h2>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-brand-blue active:opacity-70">
            <Plus size={16} /> Add
          </button>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-2xl py-12 text-center shadow-sm">
            <p className="text-gray-400 text-sm">No products yet</p>
            <button onClick={() => setShowAdd(true)} className="mt-3 text-brand-blue text-sm font-medium active:opacity-70">
              Add the first product →
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
            {products.map(p => (
              <Link key={p.id} to={`/products/${p.id}`} className="flex items-center px-4 py-4 active:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-brand-navy">{p.name}</div>
                  {p.sku && <div className="text-xs text-gray-400 mt-0.5">SKU: {p.sku}</div>}
                  <div className="text-xs text-gray-400 mt-1">
                    {p.box_length_in ? `${p.box_length_in}"×${p.box_width_in}"×${p.box_height_in}" · ` : ''}
                    {p.cases_per_pallet ? `${p.cases_per_pallet} cases/pallet` : ''}
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0 ml-2" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Add Product Sheet */}
      <Sheet open={showAdd} onClose={() => setShowAdd(false)} title="Add Product" tall>
        <form onSubmit={addProduct} className="px-5 py-4 space-y-5">
          {/* Name & SKU */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Product Name *</label>
              <input required value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}
                className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-blue" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">SKU / Item #</label>
              <input value={form.sku} onChange={e => setForm(f=>({...f,sku:e.target.value}))}
                className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-blue" />
            </div>
          </div>

          {/* Box dims */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Box Dimensions (inches)</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[['box_length_in','L'],['box_width_in','W'],['box_height_in','H']].map(([k,ph]) => (
                <input key={k} type="number" step="0.01" value={form[k]} onChange={e => setForm(f=>({...f,[k]:e.target.value}))}
                  placeholder={ph}
                  className="border border-gray-200 rounded-xl px-3 py-3 text-base text-center focus:outline-none focus:ring-2 focus:ring-brand-blue" />
              ))}
            </div>
          </div>

          {/* Counts */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quantities</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[['pieces_per_unit','Pcs/Unit'],['units_per_case','Units/Case'],['cases_per_pallet','Cases/Pallet']].map(([k,ph]) => (
                <div key={k}>
                  <input type="number" value={form[k]} onChange={e => setForm(f=>({...f,[k]:e.target.value}))}
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base text-center focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                  <div className="text-[10px] text-gray-400 text-center mt-1">{ph}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Weight */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Weight (lbs)</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[['unit_weight_lbs','Per Unit'],['case_weight_lbs','Per Case']].map(([k,ph]) => (
                <div key={k}>
                  <input type="number" step="0.01" value={form[k]} onChange={e => setForm(f=>({...f,[k]:e.target.value}))}
                    placeholder="0.00"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                  <div className="text-[10px] text-gray-400 text-center mt-1">{ph}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pallet pattern */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pallet Pattern</label>
            <input value={form.pallet_pattern} onChange={e => setForm(f=>({...f,pallet_pattern:e.target.value}))}
              placeholder="e.g. 4×5, pinwheel"
              className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} rows={3}
              className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none" />
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-brand-blue text-white rounded-xl py-3.5 text-base font-semibold active:opacity-80 disabled:opacity-50">
            {saving ? 'Saving...' : 'Add Product'}
          </button>
        </form>
      </Sheet>
    </div>
  )
}

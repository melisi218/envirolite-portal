import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, ChevronDown, ImagePlus, X } from 'lucide-react'
import Sheet from '../components/Sheet'

const STATUSES = ['In Progress', 'On Hold', 'Completed', 'Cancelled']

export default function NewRequest() {
  const navigate = useNavigate()
  const fileInputRef = useRef()
  const [companies, setCompanies] = useState([])
  const [form, setForm] = useState({
    company_id: '', title: '', notes: '', status: 'In Progress',
    case_length: '', case_width: '', case_depth: '',
    qty_per_case: '', qty_per_skid: '',
  })
  const [photos, setPhotos] = useState([]) // [{ file, preview, note }]
  const [saving, setSaving] = useState(false)

  // Add new company sheet
  const [showAddCompany, setShowAddCompany] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')
  const [addingCompany, setAddingCompany] = useState(false)

  async function loadCompanies() {
    const { data } = await supabase.from('companies').select('id, name').order('name')
    setCompanies(data || [])
  }
  useEffect(() => { loadCompanies() }, [])

  function handleCompanyChange(e) {
    if (e.target.value === '__add_new__') {
      setShowAddCompany(true)
      setForm(f => ({ ...f, company_id: '' }))
    } else {
      setForm(f => ({ ...f, company_id: e.target.value }))
    }
  }

  async function addCompany(e) {
    e.preventDefault()
    if (!newCompanyName.trim()) return
    setAddingCompany(true)
    const { data } = await supabase.from('companies').insert({ name: newCompanyName.trim() }).select().single()
    if (data) {
      await loadCompanies()
      setForm(f => ({ ...f, company_id: data.id }))
    }
    setNewCompanyName('')
    setShowAddCompany(false)
    setAddingCompany(false)
  }

  function handlePhotoSelect(e) {
    const files = Array.from(e.target.files)
    const newPhotos = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      note: '',
    }))
    setPhotos(p => [...p, ...newPhotos])
    e.target.value = ''
  }

  function removePhoto(index) {
    setPhotos(p => p.filter((_, i) => i !== index))
  }

  function updatePhotoNote(index, note) {
    setPhotos(p => p.map((ph, i) => i === index ? { ...ph, note } : ph))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)

    // Insert request
    const { data: req, error } = await supabase
      .from('requests')
      .insert({
        company_id: form.company_id,
        title: form.title,
        notes: form.notes,
        status: form.status,
        case_length: form.case_length || null,
        case_width: form.case_width || null,
        case_depth: form.case_depth || null,
        qty_per_case: form.qty_per_case || null,
        qty_per_skid: form.qty_per_skid || null,
      })
      .select()
      .single()

    if (req && photos.length > 0) {
      // Upload each photo to Supabase Storage
      for (const photo of photos) {
        const path = `requests/${req.id}/${Date.now()}_${photo.file.name}`
        const { data: upload } = await supabase.storage
          .from('request-files')
          .upload(path, photo.file)

        if (upload) {
          await supabase.from('request_files').insert({
            request_id: req.id,
            file_name: photo.file.name,
            file_path: upload.path,
            note: photo.note,
          })
        }
      }
    }

    setSaving(false)
    navigate('/requests')
  }

  const inputClass = "w-full mt-2 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-blue"
  const labelClass = "text-xs font-medium text-gray-500 uppercase tracking-wide"

  return (
    <div className="min-h-screen bg-brand-light">
      {/* Header */}
      <div className="bg-brand-navy px-5 pt-4 pb-5 flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 flex-shrink-0">
          <ArrowLeft size={18} className="text-white" />
        </button>
        <h1 className="text-white text-xl font-semibold">New Request</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-4 pt-5 pb-10 space-y-4">

        {/* Company */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <label className={labelClass}>Company</label>
          <div className="relative mt-2">
            <select required value={form.company_id} onChange={handleCompanyChange}
              className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-blue pr-10 bg-white">
              <option value="">Select company...</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value="__add_new__">+ Add New Company</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Title */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <label className={labelClass}>Title / Product</label>
          <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Q3 Packaging Redesign"
            className={inputClass} />
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <label className={labelClass}>Notes</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Add any details or notes..."
            rows={4} className={`${inputClass} resize-none`} />
        </div>

        {/* Case Dimensions */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <label className={labelClass}>Case Dimensions (in)</label>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1">
              <input type="number" inputMode="decimal" placeholder="L"
                value={form.case_length} onChange={e => setForm(f => ({ ...f, case_length: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base text-center focus:outline-none focus:ring-2 focus:ring-brand-blue" />
              <p className="text-xs text-gray-400 text-center mt-1">Length</p>
            </div>
            <span className="text-gray-300 text-xl font-light pb-5">×</span>
            <div className="flex-1">
              <input type="number" inputMode="decimal" placeholder="W"
                value={form.case_width} onChange={e => setForm(f => ({ ...f, case_width: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base text-center focus:outline-none focus:ring-2 focus:ring-brand-blue" />
              <p className="text-xs text-gray-400 text-center mt-1">Width</p>
            </div>
            <span className="text-gray-300 text-xl font-light pb-5">×</span>
            <div className="flex-1">
              <input type="number" inputMode="decimal" placeholder="D"
                value={form.case_depth} onChange={e => setForm(f => ({ ...f, case_depth: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base text-center focus:outline-none focus:ring-2 focus:ring-brand-blue" />
              <p className="text-xs text-gray-400 text-center mt-1">Depth</p>
            </div>
          </div>
        </div>

        {/* Qty per Case & Qty per Skid */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Qty per Case</label>
              <input type="number" inputMode="numeric" placeholder="0"
                value={form.qty_per_case} onChange={e => setForm(f => ({ ...f, qty_per_case: e.target.value }))}
                className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3 text-base text-center focus:outline-none focus:ring-2 focus:ring-brand-blue" />
            </div>
            <div>
              <label className={labelClass}>Qty per Skid</label>
              <input type="number" inputMode="numeric" placeholder="0"
                value={form.qty_per_skid} onChange={e => setForm(f => ({ ...f, qty_per_skid: e.target.value }))}
                className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3 text-base text-center focus:outline-none focus:ring-2 focus:ring-brand-blue" />
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <label className={labelClass}>Photos</label>

          {photos.length > 0 && (
            <div className="mt-3 space-y-3">
              {photos.map((photo, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="relative flex-shrink-0">
                    <img src={photo.preview} alt=""
                      className="w-20 h-20 rounded-xl object-cover border border-gray-100" />
                    <button type="button" onClick={() => removePhoto(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center">
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Add a note..."
                    value={photo.note}
                    onChange={e => updatePhotoNote(i, e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              ))}
            </div>
          )}

          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="mt-3 w-full border-2 border-dashed border-gray-200 rounded-xl py-4 flex items-center justify-center gap-2 text-gray-400 text-sm active:bg-gray-50">
            <ImagePlus size={18} />
            Add Photos
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple
            className="hidden" onChange={handlePhotoSelect} />
        </div>

        {/* Status */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <label className={labelClass}>Status</label>
          <div className="relative mt-2">
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-blue pr-10 bg-white">
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Submit */}
        <button type="submit" disabled={saving}
          className="w-full bg-brand-blue text-white rounded-2xl py-4 text-base font-semibold active:opacity-80 disabled:opacity-50">
          {saving ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>

      {/* Add Company Sheet */}
      <Sheet open={showAddCompany} onClose={() => setShowAddCompany(false)} title="Add Company">
        <form onSubmit={addCompany} className="px-5 py-4">
          <label className={labelClass}>Company Name</label>
          <input autoFocus value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)}
            placeholder="e.g. Cardinal Health"
            className={inputClass} />
          <button type="submit" disabled={addingCompany}
            className="w-full mt-4 bg-brand-blue text-white rounded-xl py-3.5 text-base font-semibold active:opacity-80 disabled:opacity-50">
            {addingCompany ? 'Adding...' : 'Add Company'}
          </button>
        </form>
      </Sheet>
    </div>
  )
}

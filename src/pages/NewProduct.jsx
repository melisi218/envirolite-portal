import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Camera, X, Trash2, ChevronDown } from 'lucide-react'

const APPROVAL_STATUSES = ['In process', 'Approved']

function PhotoPicker({ label, photo, onSelect, onRemove }) {
  const ref = useRef()
  return (
    <div className="flex-shrink-0 w-20">
      <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => { if (e.target.files[0]) onSelect(e.target.files[0]); e.target.value = '' }} />
      {photo ? (
        <div className="relative w-20 h-20">
          <img src={URL.createObjectURL(photo)} alt=""
            className="w-20 h-20 object-cover rounded-xl border border-gray-100" />
          <button type="button" onClick={onRemove}
            className="absolute -top-1 -right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center">
            <X size={10} className="text-white" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()}
          className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-300 active:bg-gray-50">
          <Camera size={18} />
          <span className="text-[9px] text-gray-400">{label}</span>
        </button>
      )}
    </div>
  )
}

export default function NewProduct() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requestId = searchParams.get('request_id')

  const [request, setRequest] = useState(null)
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [pcsPerUnit, setPcsPerUnit] = useState('')
  const [unitsPerCase, setUnitsPerCase] = useState('')
  const [casesPerPallet, setCasesPerPallet] = useState('')
  const [weightPerUnit, setWeightPerUnit] = useState('')
  const [weightPerCase, setWeightPerCase] = useState('')
  const [boxL, setBoxL] = useState('')
  const [boxW, setBoxW] = useState('')
  const [boxH, setBoxH] = useState('')
  const [boxSizeStatus, setBoxSizeStatus] = useState('In process')
  const [labelStatus, setLabelStatus] = useState('In process')
  const [assignedTo, setAssignedTo] = useState('')
  const [notes, setNotes] = useState('')

  const [partPhoto, setPartPhoto] = useState(null)
  const [partsInBoxPhoto, setPartsInBoxPhoto] = useState(null)
  const [palettePhoto, setPalettePhoto] = useState(null)
  const [labelPhoto, setLabelPhoto] = useState(null)

  const [users, setUsers] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (requestId) {
      supabase.from('requests').select('title, companies(name)').eq('id', requestId).single()
        .then(({ data }) => setRequest(data))
    }
    supabase.from('profiles').select('id, email').neq('email', 'mlisi@envirolite.com').order('email')
      .then(({ data }) => setUsers(data || []))
  }, [requestId])

  async function uploadSectionPhoto(productId, photo, section) {
    if (!photo) return
    const path = `products/${productId}/${section}/${Date.now()}_${photo.name}`
    const { data: upload, error } = await supabase.storage.from('product-files').upload(path, photo)
    if (!error && upload) {
      await supabase.from('product_files').insert({
        product_id: productId, file_name: photo.name, file_path: upload.path,
        file_type: section, mime_type: photo.type, size_bytes: photo.size,
      })
    }
  }

  async function save(isDraft = false) {
    if (!name.trim()) return
    setSaving(true)

    const { data: product, error } = await supabase.from('products').insert({
      request_id: requestId,
      name: name.trim(),
      sku: sku || null,
      pieces_per_unit: pcsPerUnit || null,
      units_per_case: unitsPerCase || null,
      cases_per_pallet: casesPerPallet || null,
      weight_per_unit: weightPerUnit || null,
      weight_per_case: weightPerCase || null,
      box_length_in: boxL || null,
      box_width_in: boxW || null,
      box_height_in: boxH || null,
      box_size_status: boxSizeStatus,
      label_verification_status: labelStatus,
      assigned_to: assignedTo || null,
      notes: notes || null,
      is_draft: isDraft,
    }).select().single()

    if (product) {
      await Promise.all([
        uploadSectionPhoto(product.id, partPhoto, 'part'),
        uploadSectionPhoto(product.id, partsInBoxPhoto, 'parts_in_box'),
        uploadSectionPhoto(product.id, palettePhoto, 'palette'),
        uploadSectionPhoto(product.id, labelPhoto, 'label_verification'),
      ])
      navigate(requestId ? `/requests/${requestId}` : '/requests')
    } else {
      alert('Error saving: ' + error?.message)
    }
    setSaving(false)
  }

  const sectionClass = "bg-white rounded-2xl shadow-sm p-4 space-y-3"
  const labelClass = "text-xs font-semibold text-gray-500 uppercase tracking-wide block"
  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white"

  const requestTitle = request?.title || ''
  const companyName = request?.companies?.name || ''
  const subtitle = [requestTitle, companyName].filter(Boolean).join(' · ')

  return (
    <div className="min-h-screen bg-brand-light pb-10">
      {/* Header */}
      <div className="bg-brand-navy px-5 pt-4 pb-5 relative flex flex-col items-center">
        <button onClick={() => navigate(-1)}
          className="absolute left-4 top-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20">
          <ArrowLeft size={18} className="text-white" />
        </button>
        <h1 className="text-white text-xl font-semibold mt-1">Add Product</h1>
        {subtitle && <p className="text-white/50 text-xs mt-0.5">{subtitle}</p>}
      </div>

      <div className="px-4 pt-4 space-y-3">

        {/* Product Name */}
        <div className={sectionClass}>
          <label className={labelClass}>Product Name</label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Armboards" className={inputClass} />
        </div>

        {/* SKU */}
        <div className={sectionClass}>
          <label className={labelClass}>SKU / Item #</label>
          <input value={sku} onChange={e => setSku(e.target.value)}
            placeholder="SKU or item number" className={inputClass} />
        </div>

        {/* Part */}
        <div className={sectionClass}>
          <label className={labelClass}>Part</label>
          <div className="flex items-start gap-4">
            <PhotoPicker label="Add Photos" photo={partPhoto}
              onSelect={setPartPhoto} onRemove={() => setPartPhoto(null)} />
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1">Pieces per unit</p>
              <input type="number" inputMode="numeric" placeholder="0" value={pcsPerUnit}
                onChange={e => setPcsPerUnit(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Parts in Box */}
        <div className={sectionClass}>
          <label className={labelClass}>Parts in Box</label>
          <div className="flex items-start gap-4">
            <PhotoPicker label="Add Photos" photo={partsInBoxPhoto}
              onSelect={setPartsInBoxPhoto} onRemove={() => setPartsInBoxPhoto(null)} />
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1">Units per case</p>
              <input type="number" inputMode="numeric" placeholder="0" value={unitsPerCase}
                onChange={e => setUnitsPerCase(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Palette Configuration */}
        <div className={sectionClass}>
          <label className={labelClass}>Palette Configuration</label>
          <div className="flex items-start gap-4">
            <PhotoPicker label="Add Photos" photo={palettePhoto}
              onSelect={setPalettePhoto} onRemove={() => setPalettePhoto(null)} />
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1">Cases per palette</p>
              <input type="number" inputMode="numeric" placeholder="0" value={casesPerPallet}
                onChange={e => setCasesPerPallet(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Weight */}
        <div className={sectionClass}>
          <label className={labelClass}>Weight (lbs)</label>
          <div className="flex gap-3">
            <div className="flex-1">
              <input type="number" step="0.01" value={weightPerUnit}
                onChange={e => setWeightPerUnit(e.target.value)}
                placeholder="0.00" className={inputClass + " text-center"} />
              <p className="text-[10px] text-gray-400 text-center mt-1">Per Unit</p>
            </div>
            <div className="flex-1">
              <input type="number" step="0.01" value={weightPerCase}
                onChange={e => setWeightPerCase(e.target.value)}
                placeholder="0.00" className={inputClass + " text-center"} />
              <p className="text-[10px] text-gray-400 text-center mt-1">Per Case</p>
            </div>
          </div>
        </div>

        {/* Approval Process on Box Size */}
        <div className={sectionClass}>
          <label className={labelClass}>Approval Process on Box Size</label>
          <div className="relative mb-2">
            <select value={boxSizeStatus} onChange={e => setBoxSizeStatus(e.target.value)}
              className={inputClass + " appearance-none pr-10"}>
              {APPROVAL_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="flex gap-2">
            {[['L', boxL, setBoxL, 'Length'], ['W', boxW, setBoxW, 'Width'], ['H', boxH, setBoxH, 'Height']].map(([ph, val, setter, lbl]) => (
              <div key={ph} className="flex-1">
                <input type="number" step="0.01" placeholder={ph} value={val}
                  onChange={e => setter(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base text-center focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                <p className="text-[10px] text-gray-400 text-center mt-1">{lbl}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Label Verification */}
        <div className={sectionClass}>
          <label className={labelClass}>Label Verification</label>
          <div className="flex items-start gap-4">
            <PhotoPicker label="Add Label" photo={labelPhoto}
              onSelect={setLabelPhoto} onRemove={() => setLabelPhoto(null)} />
            <div className="flex-1">
              <div className="relative">
                <select value={labelStatus} onChange={e => setLabelStatus(e.target.value)}
                  className={inputClass + " appearance-none pr-10"}>
                  {APPROVAL_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Assign */}
        <div className={sectionClass}>
          <label className={labelClass}>Assign</label>
          <div className="relative">
            <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)}
              className={inputClass + " appearance-none pr-10"}>
              <option value="">Unassigned</option>
              {users.map(u => <option key={u.id} value={u.email}>{u.email}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Notes */}
        <div className={sectionClass}>
          <label className={labelClass}>Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Add any notes or details..." rows={4}
            className={inputClass + " resize-none"} />
        </div>

        {/* Buttons */}
        <button type="button" disabled={saving || !name.trim()} onClick={() => save(false)}
          className="w-full bg-brand-blue text-white rounded-2xl py-4 text-base font-semibold active:opacity-80 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

        <button type="button" disabled={saving || !name.trim()} onClick={() => save(true)}
          className="w-full bg-white border border-gray-200 text-gray-600 rounded-2xl py-4 text-base font-semibold active:opacity-80 disabled:opacity-50">
          Save as Draft
        </button>

        <button type="button" onClick={() => navigate(-1)}
          className="w-full flex items-center justify-center gap-2 text-red-400 text-sm py-3 active:opacity-70 font-medium">
          <Trash2 size={15} /> Discard
        </button>

      </div>
    </div>
  )
}

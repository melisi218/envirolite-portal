import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Camera, X, Trash2 } from 'lucide-react'

function PhotoPicker({ label, photo, onSelect, onRemove }) {
  const ref = useRef()
  return (
    <div>
      <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => { if (e.target.files[0]) onSelect(e.target.files[0]); e.target.value = '' }} />
      {photo ? (
        <div className="relative">
          <img src={URL.createObjectURL(photo)} alt=""
            className="w-full h-40 object-cover rounded-xl border border-gray-100" />
          <button type="button" onClick={onRemove}
            className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center">
            <X size={13} className="text-white" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()}
          className="w-full h-28 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 active:bg-gray-50">
          <Camera size={20} />
          <span className="text-xs">{label}</span>
        </button>
      )}
    </div>
  )
}

export default function NewProduct() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requestId = searchParams.get('request_id')

  const [name, setName] = useState('')
  const [pcsPerUnit, setPcsPerUnit] = useState('')
  const [unitsPerCase, setUnitsPerCase] = useState('')
  const [casesPerPallet, setCasesPerPallet] = useState('')
  const [boxL, setBoxL] = useState('')
  const [boxW, setBoxW] = useState('')
  const [boxH, setBoxH] = useState('')

  const [partPhoto, setPartPhoto] = useState(null)
  const [partsInBoxPhoto, setPartsInBoxPhoto] = useState(null)
  const [palettePhoto, setPalettePhoto] = useState(null)

  const [saving, setSaving] = useState(false)

  async function uploadSectionPhoto(productId, photo, section) {
    if (!photo) return
    const path = `products/${productId}/${section}/${Date.now()}_${photo.name}`
    const { data: upload, error } = await supabase.storage.from('product-files').upload(path, photo)
    if (!error && upload) {
      await supabase.from('product_files').insert({
        product_id: productId,
        file_name: photo.name,
        file_path: upload.path,
        file_type: section,
        mime_type: photo.type,
        size_bytes: photo.size,
      })
    }
  }

  async function save(isDraft = false) {
    if (!name.trim()) return
    setSaving(true)

    const { data: product, error } = await supabase.from('products').insert({
      request_id: requestId,
      name: name.trim(),
      pieces_per_unit: pcsPerUnit || null,
      units_per_case: unitsPerCase || null,
      cases_per_pallet: casesPerPallet || null,
      box_length_in: boxL || null,
      box_width_in: boxW || null,
      box_height_in: boxH || null,
      is_draft: isDraft,
    }).select().single()

    if (product) {
      await Promise.all([
        uploadSectionPhoto(product.id, partPhoto, 'part'),
        uploadSectionPhoto(product.id, partsInBoxPhoto, 'parts_in_box'),
        uploadSectionPhoto(product.id, palettePhoto, 'palette'),
      ])
      navigate(requestId ? `/requests/${requestId}` : '/requests')
    } else {
      alert('Error saving: ' + error?.message)
    }
    setSaving(false)
  }

  const sectionClass = "bg-white rounded-2xl shadow-sm p-4 space-y-3"
  const labelClass = "text-xs font-semibold text-gray-500 uppercase tracking-wide"

  return (
    <div className="min-h-screen bg-brand-light pb-10">
      <div className="bg-brand-navy px-5 pt-4 pb-5 flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 flex-shrink-0">
          <ArrowLeft size={18} className="text-white" />
        </button>
        <h1 className="text-white text-xl font-semibold">Add Product</h1>
      </div>

      <div className="px-4 pt-5 space-y-4">

        {/* Product Name */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <label className={labelClass}>Product Name</label>
          <input required value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. 12-pack Display Box"
            className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-blue" />
        </div>

        {/* Part */}
        <div className={sectionClass}>
          <label className={labelClass}>Part</label>
          <PhotoPicker label="Upload Part Photo" photo={partPhoto}
            onSelect={setPartPhoto} onRemove={() => setPartPhoto(null)} />
          <div>
            <label className="text-xs text-gray-400">Pcs / Unit</label>
            <input type="number" inputMode="numeric" placeholder="0" value={pcsPerUnit}
              onChange={e => setPcsPerUnit(e.target.value)}
              className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>
        </div>

        {/* Parts in Box */}
        <div className={sectionClass}>
          <label className={labelClass}>Parts in Box</label>
          <PhotoPicker label="Upload Parts in Box Photo" photo={partsInBoxPhoto}
            onSelect={setPartsInBoxPhoto} onRemove={() => setPartsInBoxPhoto(null)} />
          <div>
            <label className="text-xs text-gray-400">Units / Case</label>
            <input type="number" inputMode="numeric" placeholder="0" value={unitsPerCase}
              onChange={e => setUnitsPerCase(e.target.value)}
              className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>
        </div>

        {/* Palette Configuration */}
        <div className={sectionClass}>
          <label className={labelClass}>Palette Configuration</label>
          <PhotoPicker label="Upload Palette Photo" photo={palettePhoto}
            onSelect={setPalettePhoto} onRemove={() => setPalettePhoto(null)} />
          <div>
            <label className="text-xs text-gray-400">Cases / Palette</label>
            <input type="number" inputMode="numeric" placeholder="0" value={casesPerPallet}
              onChange={e => setCasesPerPallet(e.target.value)}
              className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>
        </div>

        {/* Box Size Approval */}
        <div className={sectionClass}>
          <label className={labelClass}>Box Size Approval</label>
          <div className="flex items-center gap-2">
            {[['L','Length',boxL,setBoxL],['W','Width',boxW,setBoxW],['H','Height',boxH,setBoxH]].map(([ph,lbl,val,setter]) => (
              <div key={ph} className="flex-1">
                <input type="number" step="0.01" inputMode="decimal" placeholder={ph}
                  value={val} onChange={e => setter(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base text-center focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                <p className="text-[10px] text-gray-400 text-center mt-1">{lbl}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <button type="button" disabled={saving || !name.trim()} onClick={() => save(false)}
          className="w-full bg-brand-blue text-white rounded-2xl py-4 text-base font-semibold active:opacity-80 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Product'}
        </button>

        <button type="button" disabled={saving || !name.trim()} onClick={() => save(true)}
          className="w-full bg-white border border-gray-200 text-gray-600 rounded-2xl py-4 text-base font-semibold active:opacity-80 disabled:opacity-50">
          Save as Draft
        </button>

        <button type="button" onClick={() => navigate(-1)}
          className="w-full flex items-center justify-center gap-2 text-red-400 text-sm py-3 active:opacity-70">
          <Trash2 size={15} /> Discard
        </button>

      </div>
    </div>
  )
}

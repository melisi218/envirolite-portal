import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Camera, Trash2, X, FileDown, ChevronDown } from 'lucide-react'

const APPROVAL_STATUSES = ['In process', 'Approved']
const EXCLUDED_EMAIL = 'mlisi@envirolite.com'

function SectionPhoto({ photo, onUpload, onDelete, uploading }) {
  const ref = useRef()
  const [url, setUrl] = useState(null)

  useEffect(() => {
    if (!photo) { setUrl(null); return }
    supabase.storage.from('product-files').createSignedUrl(photo.file_path, 300)
      .then(({ data }) => setUrl(data?.signedUrl || null))
  }, [photo])

  return (
    <div className="flex-shrink-0 w-20">
      <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => { if (e.target.files[0]) onUpload(e.target.files[0]); e.target.value = '' }} />
      {url ? (
        <div className="relative w-20 h-20">
          <img src={url} alt="" className="w-20 h-20 object-cover rounded-xl border border-gray-100 cursor-pointer"
            onClick={() => window.open(url, '_blank')} />
          <button onClick={e => { e.stopPropagation(); onDelete() }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center">
            <X size={10} className="text-white" />
          </button>
        </div>
      ) : (
        <button onClick={() => ref.current?.click()} disabled={uploading}
          className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-300 active:bg-gray-50 disabled:opacity-50">
          <Camera size={18} />
          <span className="text-[9px] text-gray-400">{uploading ? '...' : 'Add Photos'}</span>
        </button>
      )}
    </div>
  )
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [files, setFiles] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({})

  async function load() {
    const [{ data: prod }, { data: fileList }, { data: userList }] = await Promise.all([
      supabase.from('products').select('*, requests(id, title, companies(name))').eq('id', id).single(),
      supabase.from('product_files').select('*').eq('product_id', id).order('uploaded_at', { ascending: false }),
      supabase.from('profiles').select('id, email').neq('email', EXCLUDED_EMAIL).order('email')
        .then(r => r).catch(() => ({ data: [] })),
    ])
    setProduct(prod)
    setFiles(fileList || [])
    setUsers(userList || [])
    if (prod) setForm({
      name: prod.name || '',
      sku: prod.sku || '',
      pieces_per_unit: prod.pieces_per_unit ?? '',
      units_per_case: prod.units_per_case ?? '',
      cases_per_pallet: prod.cases_per_pallet ?? '',
      weight_per_unit: prod.weight_per_unit ?? '',
      weight_per_case: prod.weight_per_case ?? '',
      box_length_in: prod.box_length_in ?? '',
      box_width_in: prod.box_width_in ?? '',
      box_height_in: prod.box_height_in ?? '',
      box_size_status: prod.box_size_status || 'In process',
      label_verification_status: prod.label_verification_status || 'In process',
      assigned_to: prod.assigned_to || '',
      notes: prod.notes || '',
    })
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  function photoBySection(section) {
    return files.find(f => f.file_type === section) || null
  }

  async function uploadSectionPhoto(photo, section) {
    const existing = photoBySection(section)
    if (existing) {
      await supabase.storage.from('product-files').remove([existing.file_path])
      await supabase.from('product_files').delete().eq('id', existing.id)
    }
    setUploading(true)
    const path = `products/${id}/${section}/${Date.now()}_${photo.name}`
    const { data: upload, error } = await supabase.storage.from('product-files').upload(path, photo)
    if (!error && upload) {
      await supabase.from('product_files').insert({
        product_id: id, file_name: photo.name, file_path: upload.path,
        file_type: section, mime_type: photo.type, size_bytes: photo.size,
      })
    }
    setUploading(false)
    load()
  }

  async function deleteSectionPhoto(section) {
    const existing = photoBySection(section)
    if (!existing) return
    await supabase.storage.from('product-files').remove([existing.file_path])
    await supabase.from('product_files').delete().eq('id', existing.id)
    load()
  }

  async function save() {
    setSaving(true)
    const prevAssignee = product?.assigned_to || ''
    const newAssignee = form.assigned_to || ''

    await supabase.from('products').update({
      name: form.name,
      sku: form.sku || null,
      pieces_per_unit: form.pieces_per_unit || null,
      units_per_case: form.units_per_case || null,
      cases_per_pallet: form.cases_per_pallet || null,
      weight_per_unit: form.weight_per_unit || null,
      weight_per_case: form.weight_per_case || null,
      box_length_in: form.box_length_in || null,
      box_width_in: form.box_width_in || null,
      box_height_in: form.box_height_in || null,
      box_size_status: form.box_size_status,
      label_verification_status: form.label_verification_status,
      assigned_to: newAssignee || null,
      notes: form.notes || null,
      is_draft: false,
    }).eq('id', id)

    if (newAssignee && newAssignee !== prevAssignee) {
      const { data: profile } = await supabase
        .from('profiles').select('id').eq('email', newAssignee).single()
      if (profile) {
        await supabase.from('notifications').insert({
          user_id: profile.id,
          product_id: id,
          message: `You've been assigned to "${form.name}" on request "${product?.requests?.title || ''}"`,
          read: false,
        })
      }
    }

    await load()
    setSaving(false)
  }

  async function handleDelete() {
    if (!window.confirm('Delete this product? This cannot be undone.')) return
    await supabase.from('notifications').delete().eq('product_id', id)
    await supabase.from('product_files').delete().eq('product_id', id)
    await supabase.from('products').delete().eq('id', id)
    navigate(-1)
  }

  function handlePrint() {
    const pw = window.open('', '_blank')
    const boxDims = (product?.box_length_in && product?.box_width_in && product?.box_height_in)
      ? `${product.box_length_in}" × ${product.box_width_in}" × ${product.box_height_in}"`
      : '—'
    pw.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
<title>${product?.name} — Envirolite</title>
<style>
@page{size:8.5in 11in;margin:0.75in}
*{font-family:-apple-system,Helvetica,Arial,sans-serif;box-sizing:border-box}
body{color:#111;font-size:11pt}
.header{border-bottom:2px solid #003366;padding-bottom:12pt;margin-bottom:18pt}
.brand{font-size:18pt;font-weight:300;letter-spacing:0.2em;color:#003366}
.subtitle{font-size:8pt;letter-spacing:0.3em;color:#2563EB;text-transform:uppercase;margin-top:2pt}
h1{font-size:16pt;font-weight:600;margin:8pt 0 4pt}
.meta{font-size:9pt;color:#666}
.section{margin-bottom:16pt}
.section-title{font-size:8pt;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#003366;border-bottom:1px solid #eee;padding-bottom:4pt;margin-bottom:8pt}
.row{display:flex;justify-content:space-between;padding:4pt 0;border-bottom:1px solid #f5f5f5}
.label{color:#666;font-size:10pt}
.value{font-weight:600;font-size:10pt}
.badge{display:inline-block;padding:2pt 8pt;border-radius:20pt;font-size:8pt;font-weight:600}
.badge-process{background:#FEF9C3;color:#854D0E}
.badge-approved{background:#DCFCE7;color:#166534}
.footer{position:fixed;bottom:0.5in;left:0.75in;right:0.75in;text-align:center;font-size:8pt;color:#aaa;border-top:1px solid #eee;padding-top:6pt}
</style></head><body>
<div class="header"><div class="brand">ENVIROLITE</div><div class="subtitle">Portal</div></div>
<div class="meta">${product?.requests?.companies?.name || ''} · Request: ${product?.requests?.title || ''}</div>
<h1>${product?.name || ''}</h1>
${product?.sku ? `<div class="meta">SKU: ${product.sku}</div>` : ''}
<div class="section"><div class="section-title">Part</div><div class="row"><span class="label">Pcs / Unit</span><span class="value">${product?.pieces_per_unit ?? '—'}</span></div></div>
<div class="section"><div class="section-title">Parts in Box</div><div class="row"><span class="label">Units / Case</span><span class="value">${product?.units_per_case ?? '—'}</span></div></div>
<div class="section"><div class="section-title">Palette Configuration</div><div class="row"><span class="label">Cases / Palette</span><span class="value">${product?.cases_per_pallet ?? '—'}</span></div></div>
<div class="section"><div class="section-title">Weight (lbs)</div>
<div class="row"><span class="label">Per Unit</span><span class="value">${product?.weight_per_unit ?? '—'}</span></div>
<div class="row"><span class="label">Per Case</span><span class="value">${product?.weight_per_case ?? '—'}</span></div></div>
<div class="section"><div class="section-title">Approval Process on Box Size</div>
<div class="row"><span class="label">Dimensions</span><span class="value">${boxDims}</span></div>
<div class="row"><span class="label">Status</span><span class="value"><span class="badge ${product?.box_size_status === 'Approved' ? 'badge-approved' : 'badge-process'}">${product?.box_size_status || 'In process'}</span></span></div></div>
<div class="section"><div class="section-title">Label Verification</div>
<div class="row"><span class="label">Status</span><span class="value"><span class="badge ${product?.label_verification_status === 'Approved' ? 'badge-approved' : 'badge-process'}">${product?.label_verification_status || 'In process'}</span></span></div></div>
${product?.assigned_to ? `<div class="section"><div class="section-title">Assigned To</div><div class="row"><span class="label">Employee</span><span class="value">${product.assigned_to}</span></div></div>` : ''}
${product?.notes ? `<div class="section"><div class="section-title">Notes</div><p>${product.notes}</p></div>` : ''}
<div class="footer">Envirolite Portal · ${new Date().toLocaleDateString()}</div>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`)
    pw.document.close()
  }

  const sectionClass = "bg-white rounded-2xl shadow-sm p-4"
  const labelClass = "text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block"
  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white"

  if (loading) return <div className="py-20 text-center text-gray-400">Loading...</div>
  if (!product) return <div className="py-20 text-center text-gray-400">Not found</div>

  const requestTitle = product.requests?.title || ''
  const companyName = product.requests?.companies?.name || ''
  const subtitle = [requestTitle, companyName].filter(Boolean).join(' · ')

  return (
    <div className="min-h-screen bg-brand-light pb-10">
      {/* Header */}
      <div className="bg-brand-navy px-5 pt-4 pb-5 relative flex flex-col items-center">
        <button onClick={() => navigate(-1)}
          className="absolute left-4 top-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20">
          <ArrowLeft size={18} className="text-white" />
        </button>
        <button onClick={handlePrint}
          className="absolute right-4 top-4 flex items-center gap-1 text-white/70 text-sm active:opacity-70">
          <FileDown size={16} /> PDF
        </button>
        <h1 className="text-white text-xl font-semibold mt-1">{product.name}</h1>
        {subtitle && <p className="text-white/50 text-xs mt-0.5">{subtitle}</p>}
      </div>

      <div className="px-4 pt-4 space-y-3">

        {/* Product Name */}
        <div className={sectionClass}>
          <label className={labelClass}>Product Name</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Armboards" className={inputClass} />
        </div>

        {/* SKU */}
        <div className={sectionClass}>
          <label className={labelClass}>SKU / Item #</label>
          <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
            placeholder="SKU or item number" className={inputClass} />
        </div>

        {/* Part */}
        <div className={sectionClass}>
          <span className={labelClass}>Part</span>
          <div className="flex items-start gap-4">
            <SectionPhoto photo={photoBySection('part')} uploading={uploading}
              onUpload={f => uploadSectionPhoto(f, 'part')}
              onDelete={() => deleteSectionPhoto('part')} />
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1">Pieces per unit</p>
              <input type="number" value={form.pieces_per_unit}
                onChange={e => setForm(f => ({ ...f, pieces_per_unit: e.target.value }))}
                placeholder="0" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Parts in Box */}
        <div className={sectionClass}>
          <span className={labelClass}>Parts in Box</span>
          <div className="flex items-start gap-4">
            <SectionPhoto photo={photoBySection('parts_in_box')} uploading={uploading}
              onUpload={f => uploadSectionPhoto(f, 'parts_in_box')}
              onDelete={() => deleteSectionPhoto('parts_in_box')} />
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1">Units per case</p>
              <input type="number" value={form.units_per_case}
                onChange={e => setForm(f => ({ ...f, units_per_case: e.target.value }))}
                placeholder="0" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Palette Configuration */}
        <div className={sectionClass}>
          <span className={labelClass}>Palette Configuration</span>
          <div className="flex items-start gap-4">
            <SectionPhoto photo={photoBySection('palette')} uploading={uploading}
              onUpload={f => uploadSectionPhoto(f, 'palette')}
              onDelete={() => deleteSectionPhoto('palette')} />
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1">Cases per palette</p>
              <input type="number" value={form.cases_per_pallet}
                onChange={e => setForm(f => ({ ...f, cases_per_pallet: e.target.value }))}
                placeholder="0" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Weight */}
        <div className={sectionClass}>
          <span className={labelClass}>Weight (lbs)</span>
          <div className="flex gap-3">
            <div className="flex-1">
              <input type="number" step="0.01" value={form.weight_per_unit}
                onChange={e => setForm(f => ({ ...f, weight_per_unit: e.target.value }))}
                placeholder="0.00" className={inputClass + " text-center"} />
              <p className="text-[10px] text-gray-400 text-center mt-1">Per Unit</p>
            </div>
            <div className="flex-1">
              <input type="number" step="0.01" value={form.weight_per_case}
                onChange={e => setForm(f => ({ ...f, weight_per_case: e.target.value }))}
                placeholder="0.00" className={inputClass + " text-center"} />
              <p className="text-[10px] text-gray-400 text-center mt-1">Per Case</p>
            </div>
          </div>
        </div>

        {/* Approval Process on Box Size */}
        <div className={sectionClass}>
          <span className={labelClass}>Approval Process on Box Size</span>
          <div className="relative mb-3">
            <select value={form.box_size_status}
              onChange={e => setForm(f => ({ ...f, box_size_status: e.target.value }))}
              className={inputClass + " appearance-none pr-10"}>
              {APPROVAL_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="flex gap-2">
            {[['box_length_in','L','Length'],['box_width_in','W','Width'],['box_height_in','H','Height']].map(([key,ph,lbl]) => (
              <div key={key} className="flex-1">
                <input type="number" step="0.01" placeholder={ph} value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base text-center focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                <p className="text-[10px] text-gray-400 text-center mt-1">{lbl}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Label Verification */}
        <div className={sectionClass}>
          <span className={labelClass}>Label Verification</span>
          <div className="flex items-start gap-4">
            <SectionPhoto photo={photoBySection('label_verification')} uploading={uploading}
              onUpload={f => uploadSectionPhoto(f, 'label_verification')}
              onDelete={() => deleteSectionPhoto('label_verification')} />
            <div className="flex-1">
              <div className="relative">
                <select value={form.label_verification_status}
                  onChange={e => setForm(f => ({ ...f, label_verification_status: e.target.value }))}
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
          <span className={labelClass}>Assign</span>
          <div className="relative">
            <select value={form.assigned_to}
              onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
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
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Add any notes or details..." rows={4}
            className={inputClass + " resize-none"} />
        </div>

        {/* Save */}
        <button onClick={save} disabled={saving || !form.name.trim()}
          className="w-full bg-brand-blue text-white rounded-2xl py-4 text-base font-semibold active:opacity-80 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

        {/* Delete */}
        <button onClick={handleDelete}
          className="w-full text-red-400 text-sm py-3 active:opacity-70 font-medium">
          Delete Product
        </button>

      </div>
    </div>
  )
}

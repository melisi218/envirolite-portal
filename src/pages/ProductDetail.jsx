import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ChevronLeft, Camera, Trash2, Edit2, Check, X, FileDown, ChevronDown } from 'lucide-react'

const APPROVAL_STATUSES = ['In process', 'Approved']
const EXCLUDED_EMAIL = 'mlisi@envirolite.com'

const STATUS_BADGE = {
  'In process': 'bg-yellow-100 text-yellow-600',
  'Approved': 'bg-green-100 text-green-600',
}

function SectionPhoto({ photo, onUpload, onDelete, uploading }) {
  const ref = useRef()
  const [url, setUrl] = useState(null)

  useEffect(() => {
    if (!photo) { setUrl(null); return }
    supabase.storage.from('product-files').createSignedUrl(photo.file_path, 300)
      .then(({ data }) => setUrl(data?.signedUrl || null))
  }, [photo])

  return (
    <div>
      <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => { if (e.target.files[0]) onUpload(e.target.files[0]); e.target.value = '' }} />
      {url ? (
        <div className="relative">
          <img src={url} alt="" className="w-full h-40 object-cover rounded-xl border border-gray-100" onClick={() => window.open(url, '_blank')} />
          <button onClick={e => { e.stopPropagation(); onDelete() }}
            className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center">
            <X size={13} className="text-white" />
          </button>
        </div>
      ) : (
        <button onClick={() => ref.current?.click()} disabled={uploading}
          className="w-full h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-300 active:bg-gray-50 disabled:opacity-50">
          <Camera size={22} />
          <span className="text-xs text-gray-400">{uploading ? 'Uploading...' : 'Tap to add photo'}</span>
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
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)

  async function load() {
    const [{ data: prod }, { data: fileList }, { data: userList }] = await Promise.all([
      supabase.from('products').select('*, requests(id, title, companies(name))').eq('id', id).single(),
      supabase.from('product_files').select('*').eq('product_id', id).order('uploaded_at', { ascending: false }),
      supabase.from('profiles').select('id, email').neq('email', EXCLUDED_EMAIL).order('email').then(r => r),
    ])
    setProduct(prod)
    setFiles(fileList || [])
    setUsers(userList || [])
    if (prod) setEditForm({
      name: prod.name || '',
      pieces_per_unit: prod.pieces_per_unit ?? '',
      units_per_case: prod.units_per_case ?? '',
      cases_per_pallet: prod.cases_per_pallet ?? '',
      box_length_in: prod.box_length_in ?? '',
      box_width_in: prod.box_width_in ?? '',
      box_height_in: prod.box_height_in ?? '',
      box_size_status: prod.box_size_status || 'In process',
      label_verification_status: prod.label_verification_status || 'In process',
      assigned_to: prod.assigned_to || '',
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

  async function saveEdit() {
    setSaving(true)
    await supabase.from('products').update({
      name: editForm.name,
      pieces_per_unit: editForm.pieces_per_unit || null,
      units_per_case: editForm.units_per_case || null,
      cases_per_pallet: editForm.cases_per_pallet || null,
      box_length_in: editForm.box_length_in || null,
      box_width_in: editForm.box_width_in || null,
      box_height_in: editForm.box_height_in || null,
      box_size_status: editForm.box_size_status,
      label_verification_status: editForm.label_verification_status,
      assigned_to: editForm.assigned_to || null,
      is_draft: false,
    }).eq('id', id)
    await load()
    setEditing(false)
    setSaving(false)
  }

  async function handleDelete() {
    if (!window.confirm('Delete this product? This cannot be undone.')) return
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
.value{font-weight:500;font-size:10pt}
.badge{display:inline-block;padding:2pt 8pt;border-radius:20pt;font-size:8pt;font-weight:600}
.badge-process{background:#FEF9C3;color:#854D0E}
.badge-approved{background:#DCFCE7;color:#166534}
.footer{position:fixed;bottom:0.5in;left:0.75in;right:0.75in;text-align:center;font-size:8pt;color:#aaa;border-top:1px solid #eee;padding-top:6pt}
</style></head><body>
<div class="header"><div class="brand">ENVIROLITE</div><div class="subtitle">Portal</div></div>
<div class="meta">${product?.requests?.companies?.name || ''} · Request: ${product?.requests?.title || ''}</div>
<h1>${product?.name || ''}</h1>
${product?.is_draft ? '<span class="badge badge-process">Draft</span>' : ''}
<div class="section"><div class="section-title">Part</div><div class="row"><span class="label">Pcs / Unit</span><span class="value">${product?.pieces_per_unit ?? '—'}</span></div></div>
<div class="section"><div class="section-title">Parts in Box</div><div class="row"><span class="label">Units / Case</span><span class="value">${product?.units_per_case ?? '—'}</span></div></div>
<div class="section"><div class="section-title">Palette Configuration</div><div class="row"><span class="label">Cases / Palette</span><span class="value">${product?.cases_per_pallet ?? '—'}</span></div></div>
<div class="section"><div class="section-title">Box Size Approval</div>
<div class="row"><span class="label">Dimensions</span><span class="value">${boxDims}</span></div>
<div class="row"><span class="label">Status</span><span class="value"><span class="badge ${product?.box_size_status === 'Approved' ? 'badge-approved' : 'badge-process'}">${product?.box_size_status || 'In process'}</span></span></div></div>
<div class="section"><div class="section-title">Label Verification</div>
<div class="row"><span class="label">Status</span><span class="value"><span class="badge ${product?.label_verification_status === 'Approved' ? 'badge-approved' : 'badge-process'}">${product?.label_verification_status || 'In process'}</span></span></div></div>
${product?.assigned_to ? `<div class="section"><div class="section-title">Assigned To</div><div class="row"><span class="label">Employee</span><span class="value">${product.assigned_to}</span></div></div>` : ''}
<div class="footer">Envirolite Portal · ${new Date().toLocaleDateString()}</div>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`)
    pw.document.close()
  }

  const sectionClass = "bg-white rounded-2xl shadow-sm p-4 space-y-3"
  const labelClass = "text-xs font-semibold text-gray-500 uppercase tracking-wide"

  if (loading) return <div className="py-20 text-center text-gray-400">Loading...</div>
  if (!product) return <div className="py-20 text-center text-gray-400">Not found</div>

  return (
    <div className="min-h-screen bg-brand-light pb-10">
      {/* Header */}
      <div className="bg-brand-navy px-5 pt-4 pb-5">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-brand-blue text-sm active:opacity-70">
            <ChevronLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-3">
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 text-brand-blue text-sm active:opacity-70">
              <FileDown size={14} /> PDF
            </button>
            {!editing ? (
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-brand-blue text-sm active:opacity-70">
                <Edit2 size={14} /> Edit
              </button>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => setEditing(false)} className="text-white/50 text-sm">Cancel</button>
                <button onClick={saveEdit} disabled={saving}
                  className="flex items-center gap-1 text-brand-blue text-sm font-semibold disabled:opacity-50">
                  <Check size={14} /> {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="text-brand-blue text-xs font-medium tracking-widest uppercase mb-1">
          {product.requests?.companies?.name}
        </div>
        {editing ? (
          <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
            className="w-full bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-2.5 text-lg font-semibold focus:outline-none border border-white/20" />
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-white text-xl font-semibold">{product.name}</h1>
            {product.is_draft && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white/70">Draft</span>
            )}
          </div>
        )}
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* Part */}
        <div className={sectionClass}>
          <label className={labelClass}>Part</label>
          <SectionPhoto photo={photoBySection('part')} uploading={uploading}
            onUpload={f => uploadSectionPhoto(f, 'part')}
            onDelete={() => deleteSectionPhoto('part')} />
          <div>
            <label className="text-xs text-gray-400">Pcs / Unit</label>
            {editing ? (
              <input type="number" value={editForm.pieces_per_unit}
                onChange={e => setEditForm(f => ({ ...f, pieces_per_unit: e.target.value }))}
                className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-blue" />
            ) : (
              <div className="text-base font-medium text-brand-navy mt-1">{product.pieces_per_unit ?? '—'}</div>
            )}
          </div>
        </div>

        {/* Parts in Box */}
        <div className={sectionClass}>
          <label className={labelClass}>Parts in Box</label>
          <SectionPhoto photo={photoBySection('parts_in_box')} uploading={uploading}
            onUpload={f => uploadSectionPhoto(f, 'parts_in_box')}
            onDelete={() => deleteSectionPhoto('parts_in_box')} />
          <div>
            <label className="text-xs text-gray-400">Units / Case</label>
            {editing ? (
              <input type="number" value={editForm.units_per_case}
                onChange={e => setEditForm(f => ({ ...f, units_per_case: e.target.value }))}
                className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-blue" />
            ) : (
              <div className="text-base font-medium text-brand-navy mt-1">{product.units_per_case ?? '—'}</div>
            )}
          </div>
        </div>

        {/* Palette Configuration */}
        <div className={sectionClass}>
          <label className={labelClass}>Palette Configuration</label>
          <SectionPhoto photo={photoBySection('palette')} uploading={uploading}
            onUpload={f => uploadSectionPhoto(f, 'palette')}
            onDelete={() => deleteSectionPhoto('palette')} />
          <div>
            <label className="text-xs text-gray-400">Cases / Palette</label>
            {editing ? (
              <input type="number" value={editForm.cases_per_pallet}
                onChange={e => setEditForm(f => ({ ...f, cases_per_pallet: e.target.value }))}
                className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-blue" />
            ) : (
              <div className="text-base font-medium text-brand-navy mt-1">{product.cases_per_pallet ?? '—'}</div>
            )}
          </div>
        </div>

        {/* Box Size Approval */}
        <div className={sectionClass}>
          <label className={labelClass}>Box Size Approval</label>
          {editing ? (
            <>
              <div className="flex items-center gap-2">
                {[['box_length_in', 'L', 'Length'], ['box_width_in', 'W', 'Width'], ['box_height_in', 'H', 'Height']].map(([key, ph, lbl]) => (
                  <div key={key} className="flex-1">
                    <input type="number" step="0.01" placeholder={ph}
                      value={editForm[key]}
                      onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base text-center focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                    <p className="text-[10px] text-gray-400 text-center mt-1">{lbl}</p>
                  </div>
                ))}
              </div>
              <div className="relative">
                <select value={editForm.box_size_status}
                  onChange={e => setEditForm(f => ({ ...f, box_size_status: e.target.value }))}
                  className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-blue pr-10 bg-white">
                  {APPROVAL_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Dimensions</span>
                <span className="text-sm font-medium text-brand-navy">
                  {(product.box_length_in && product.box_width_in && product.box_height_in)
                    ? `${product.box_length_in}" × ${product.box_width_in}" × ${product.box_height_in}"`
                    : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_BADGE[product.box_size_status] || STATUS_BADGE['In process']}`}>
                  {product.box_size_status || 'In process'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Label Verification */}
        <div className={sectionClass}>
          <label className={labelClass}>Label Verification</label>
          <SectionPhoto photo={photoBySection('label_verification')} uploading={uploading}
            onUpload={f => uploadSectionPhoto(f, 'label_verification')}
            onDelete={() => deleteSectionPhoto('label_verification')} />
          {editing ? (
            <div className="relative">
              <select value={editForm.label_verification_status}
                onChange={e => setEditForm(f => ({ ...f, label_verification_status: e.target.value }))}
                className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-blue pr-10 bg-white">
                {APPROVAL_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Status</span>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_BADGE[product.label_verification_status] || STATUS_BADGE['In process']}`}>
                {product.label_verification_status || 'In process'}
              </span>
            </div>
          )}
        </div>

        {/* Assign to Employee */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <label className={labelClass}>Assigned To</label>
          {editing ? (
            users.length > 0 ? (
              <div className="relative mt-2">
                <select value={editForm.assigned_to}
                  onChange={e => setEditForm(f => ({ ...f, assigned_to: e.target.value }))}
                  className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-blue pr-10 bg-white">
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u.id} value={u.email}>{u.email}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            ) : (
              <input value={editForm.assigned_to}
                onChange={e => setEditForm(f => ({ ...f, assigned_to: e.target.value }))}
                placeholder="Employee email"
                className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-blue" />
            )
          ) : (
            <div className="text-sm font-medium text-brand-navy mt-1">
              {product.assigned_to || <span className="text-gray-400">Unassigned</span>}
            </div>
          )}
        </div>

        {/* Delete */}
        <button onClick={handleDelete}
          className="w-full flex items-center justify-center gap-2 text-red-400 text-sm py-3 active:opacity-70">
          <Trash2 size={15} /> Delete Product
        </button>

      </div>
    </div>
  )
}

import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ChevronLeft, Camera, FileText, Trash2, Download, Edit2, Check, X, Upload } from 'lucide-react'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editNotes, setEditNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const photoRef = useRef()
  const docRef = useRef()

  async function load() {
    const [{ data: prod }, { data: fileList }] = await Promise.all([
      supabase.from('products').select('*, requests(id, title, companies(name))').eq('id', id).single(),
      supabase.from('product_files').select('*').eq('product_id', id).order('uploaded_at', { ascending: false }),
    ])
    setProduct(prod); setNotes(prod?.notes || ''); setFiles(fileList || []); setLoading(false)
  }
  useEffect(() => { load() }, [id])

  async function uploadFile(e, fileType) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const path = `${id}/${fileType}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('product-files').upload(path, file)
    if (!error) {
      await supabase.from('product_files').insert({ product_id: id, file_name: file.name, file_path: path, file_type: fileType, mime_type: file.type, size_bytes: file.size })
      load()
    } else { alert('Upload failed: ' + error.message) }
    setUploading(false); e.target.value = ''
  }

  async function deleteFile(file) {
    if (!confirm(`Delete "${file.file_name}"?`)) return
    await supabase.storage.from('product-files').remove([file.file_path])
    await supabase.from('product_files').delete().eq('id', file.id)
    load()
  }

  async function getFileUrl(path) {
    const { data } = await supabase.storage.from('product-files').createSignedUrl(path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function saveNotes() {
    await supabase.from('products').update({ notes }).eq('id', id)
    setProduct(p => ({ ...p, notes })); setEditNotes(false)
  }

  const formatSize = b => !b ? '' : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`
  const f = v => (v !== null && v !== undefined && v !== '') ? v : '—'
  const photos = files.filter(f => f.file_type === 'photo')
  const docs = files.filter(f => f.file_type === 'document')

  if (loading) return <div className="py-20 text-center text-gray-400">Loading...</div>
  if (!product) return <div className="py-20 text-center text-gray-400">Not found</div>

  const specs = [
    { label: 'Box Size', value: product.box_length_in ? `${product.box_length_in}"×${product.box_width_in}"×${product.box_height_in}"` : '—' },
    { label: 'Pcs / Unit', value: f(product.pieces_per_unit) },
    { label: 'Units / Case', value: f(product.units_per_case) },
    { label: 'Cases / Pallet', value: f(product.cases_per_pallet) },
    { label: 'Unit Weight', value: product.unit_weight_lbs ? `${product.unit_weight_lbs} lbs` : '—' },
    { label: 'Case Weight', value: product.case_weight_lbs ? `${product.case_weight_lbs} lbs` : '—' },
    { label: 'Pallet Pattern', value: f(product.pallet_pattern) },
  ]

  return (
    <div>
      {/* Header */}
      <div className="bg-brand-navy px-5 pt-4 pb-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-brand-blue text-sm mb-3 active:opacity-70">
          <ChevronLeft size={16} /> Back
        </button>
        <div className="text-brand-blue text-xs font-medium tracking-widest uppercase mb-1">
          {product.requests?.companies?.name}
        </div>
        <h1 className="text-white text-xl font-semibold">{product.name}</h1>
        {product.sku && <p className="text-white/40 text-sm mt-0.5">SKU: {product.sku}</p>}
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Specs */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h2 className="text-xs font-semibold text-brand-navy uppercase tracking-wide">Packaging Specs</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {specs.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3.5">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-medium text-brand-navy">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-brand-navy uppercase tracking-wide">Notes</h2>
            {!editNotes && (
              <button onClick={() => setEditNotes(true)} className="flex items-center gap-1 text-xs text-brand-blue active:opacity-70">
                <Edit2 size={12} /> Edit
              </button>
            )}
          </div>
          {editNotes ? (
            <>
              <textarea autoFocus value={notes} onChange={e => setNotes(e.target.value)} rows={4}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none" />
              <div className="flex gap-2 mt-2">
                <button onClick={saveNotes} className="flex items-center gap-1 bg-brand-blue text-white text-xs px-4 py-2 rounded-lg active:opacity-80">
                  <Check size={12} /> Save
                </button>
                <button onClick={() => { setEditNotes(false); setNotes(product.notes || '') }}
                  className="text-xs text-gray-400 px-3 py-2">Cancel</button>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-600">{notes || <span className="text-gray-300">No notes</span>}</p>
          )}
        </div>

        {/* Photos */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <h2 className="text-xs font-semibold text-brand-navy uppercase tracking-wide">Photos ({photos.length})</h2>
            <div>
              <input type="file" ref={photoRef} className="hidden" accept="image/*" capture="environment" onChange={e => uploadFile(e, 'photo')} />
              <button onClick={() => photoRef.current?.click()} disabled={uploading}
                className="flex items-center gap-1.5 text-xs font-medium text-brand-blue active:opacity-70 disabled:opacity-40">
                <Camera size={14} /> {uploading ? 'Uploading...' : 'Add Photo'}
              </button>
            </div>
          </div>
          {photos.length === 0 ? (
            <button onClick={() => photoRef.current?.click()}
              className="w-full py-10 text-center active:bg-gray-50">
              <Camera size={28} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">Tap to add photos</p>
            </button>
          ) : (
            <div className="grid grid-cols-3 gap-0.5 p-0.5">
              {photos.map(file => (
                <div key={file.id} className="relative aspect-square bg-gray-100 active:opacity-80"
                  onClick={() => getFileUrl(file.file_path)}>
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera size={24} className="text-gray-300" />
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteFile(file) }}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                    <X size={12} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documents */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <h2 className="text-xs font-semibold text-brand-navy uppercase tracking-wide">Documents ({docs.length})</h2>
            <div>
              <input type="file" ref={docRef} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg" onChange={e => uploadFile(e, 'document')} />
              <button onClick={() => docRef.current?.click()} disabled={uploading}
                className="flex items-center gap-1.5 text-xs font-medium text-brand-blue active:opacity-70 disabled:opacity-40">
                <Upload size={14} /> Upload
              </button>
            </div>
          </div>
          {docs.length === 0 ? (
            <button onClick={() => docRef.current?.click()} className="w-full py-10 text-center active:bg-gray-50">
              <FileText size={28} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">Tap to upload labels or documents</p>
            </button>
          ) : (
            <div className="divide-y divide-gray-50">
              {docs.map(file => (
                <div key={file.id} className="flex items-center px-4 py-3.5">
                  <FileText size={18} className="text-brand-blue mr-3 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-brand-navy truncate">{file.file_name}</div>
                    <div className="text-xs text-gray-400">{formatSize(file.size_bytes)}</div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button onClick={() => getFileUrl(file.file_path)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl active:bg-gray-100">
                      <Download size={16} className="text-gray-400" />
                    </button>
                    <button onClick={() => deleteFile(file)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl active:bg-red-50">
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-2" />
      </div>
    </div>
  )
}

import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, ChevronRight, ChevronDown, Edit2, Plus, X, Trash2 } from 'lucide-react'

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
  const [photos, setPhotos] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)

  // Edit project mode
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)

  // Inline notes
  const [notes, setNotes] = useState('')
  const [notesDirty, setNotesDirty] = useState(false)
  const [notesSaving, setNotesSaving] = useState(false)

  // Photos
  const [uploading, setUploading] = useState(false)
  const photoInputRef = useRef()

  async function load() {
    const [{ data: req }, { data: prods }, { data: cos }, { data: reqFiles }] = await Promise.all([
      supabase.from('requests').select('*, companies(name)').eq('id', id).single(),
      supabase.from('products').select('*').eq('request_id', id).order('created_at'),
      supabase.from('companies').select('id, name').order('name'),
      supabase.from('request_files').select('*').eq('request_id', id).order('created_at'),
    ])
    setRequest(req)
    setProducts(prods || [])
    setCompanies(cos || [])
    if (req) {
      setEditForm({ title: req.title, company_id: req.company_id, status: req.status })
      setNotes(req.notes || '')
      setNotesDirty(false)
    }
    // Load signed URLs for photos
    if (reqFiles && reqFiles.length > 0) {
      const withUrls = await Promise.all(
        reqFiles.map(async f => {
          const { data } = await supabase.storage.from('request-files').createSignedUrl(f.file_path, 300)
          return { ...f, url: data?.signedUrl }
        })
      )
      setPhotos(withUrls.filter(f => f.url))
    } else {
      setPhotos([])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function saveEdit() {
    setSaving(true)
    await supabase.from('requests').update({
      title: editForm.title,
      company_id: editForm.company_id,
      status: editForm.status,
    }).eq('id', id)
    await load()
    setEditing(false)
    setSaving(false)
  }

  function cancelEdit() {
    setEditForm({ title: request.title, company_id: request.company_id, status: request.status })
    setEditing(false)
  }

  async function uploadPhoto(file) {
    setUploading(true)
    const path = `requests/${id}/${Date.now()}_${file.name}`
    const { data: upload, error } = await supabase.storage.from('request-files').upload(path, file)
    if (!error && upload) {
      await supabase.from('request_files').insert({
        request_id: id,
        file_name: file.name,
        file_path: upload.path,
        mime_type: file.type,
        size_bytes: file.size,
      })
    }
    setUploading(false)
    load()
  }

  async function deletePhoto(photo) {
    await supabase.storage.from('request-files').remove([photo.file_path])
    await supabase.from('request_files').delete().eq('id', photo.id)
    load()
  }

  async function handleDeleteRequest() {
    if (!window.confirm('Delete this project? All products and photos will also be deleted.')) return
    // Delete product files from storage
    const { data: prodFiles } = await supabase.from('product_files')
      .select('file_path').eq('product_id', id) // note: we need product ids first
    const { data: prods } = await supabase.from('products').select('id').eq('request_id', id)
    if (prods?.length) {
      const prodIds = prods.map(p => p.id)
      const { data: pFiles } = await supabase.from('product_files').select('file_path').in('product_id', prodIds)
      if (pFiles?.length) {
        await supabase.storage.from('product-files').remove(pFiles.map(f => f.file_path))
      }
      await supabase.from('notifications').delete().in('product_id', prodIds)
      await supabase.from('product_files').delete().in('product_id', prodIds)
      await supabase.from('products').delete().eq('request_id', id)
    }
    // Delete request files
    const { data: rFiles } = await supabase.from('request_files').select('file_path').eq('request_id', id)
    if (rFiles?.length) {
      await supabase.storage.from('request-files').remove(rFiles.map(f => f.file_path))
    }
    await supabase.from('request_files').delete().eq('request_id', id)
    await supabase.from('requests').delete().eq('id', id)
    navigate('/requests')
  }

  async function saveNotes() {
    setNotesSaving(true)
    await supabase.from('requests').update({ notes }).eq('id', id)
    setNotesDirty(false)
    setNotesSaving(false)
  }

  if (loading) return <div className="py-20 text-center text-gray-400">Loading...</div>
  if (!request) return <div className="py-20 text-center text-gray-400">Not found</div>

  return (
    <div className="min-h-screen bg-brand-light pb-10">

      {/* Header */}
      <div className="bg-brand-navy px-5 pt-4 pb-5 relative flex flex-col items-center">
        <button onClick={() => navigate(-1)}
          className="absolute left-4 top-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20">
          <ArrowLeft size={18} className="text-white" />
        </button>

        {!editing && (
          <button onClick={() => setEditing(true)}
            className="absolute right-4 top-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20">
            <Edit2 size={16} className="text-white" />
          </button>
        )}

        <h1 className="text-white text-xl font-semibold mt-1 text-center">{request.title}</h1>
        {request.companies?.name && (
          <p className="text-white/50 text-sm mt-0.5">{request.companies.name}</p>
        )}

        {editing && (
          <div className="flex items-center gap-4 mt-3">
            <button onClick={cancelEdit} className="text-white/50 text-sm px-4 py-1.5">Cancel</button>
            <button onClick={saveEdit} disabled={saving}
              className="text-brand-blue text-sm font-semibold px-4 py-1.5 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Edit form — extends below header when editing */}
      {editing && (
        <div className="bg-brand-navy px-5 pb-5 space-y-3 border-t border-white/10">
          <input value={editForm.title}
            onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Project Name"
            className="w-full bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-2.5 text-base font-semibold focus:outline-none border border-white/20" />
          <div className="relative">
            <select value={editForm.company_id}
              onChange={e => setEditForm(f => ({ ...f, company_id: e.target.value }))}
              className="w-full appearance-none bg-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none border border-white/20 pr-8">
              {companies.map(c => <option key={c.id} value={c.id} className="text-black">{c.name}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          </div>
        </div>
      )}

      <div className="px-4 pt-4 space-y-4">

        {/* Notes */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</span>
            {notes && !notesDirty && (
              <span className="text-brand-blue text-xs font-medium">View All</span>
            )}
          </div>
          <textarea
            value={notes}
            onChange={e => { setNotes(e.target.value); setNotesDirty(true) }}
            placeholder="Add any notes or details..."
            rows={4}
            className="w-full text-sm text-gray-700 placeholder-gray-300 focus:outline-none resize-none border border-gray-200 rounded-xl px-3 py-3"
          />
          {notesDirty && (
            <button onClick={saveNotes} disabled={notesSaving}
              className="w-full mt-2 bg-brand-blue text-white rounded-2xl py-4 text-base font-semibold active:opacity-80 disabled:opacity-50">
              {notesSaving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>

        {/* Photos */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-3">Photos</span>
          <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => { Array.from(e.target.files).forEach(uploadPhoto); e.target.value = '' }} />
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {photos.map(p => (
              <div key={p.id} className="relative flex-shrink-0">
                <img src={p.url} alt=""
                  onClick={() => window.open(p.url, '_blank')}
                  className="w-16 h-16 rounded-xl object-cover cursor-pointer border border-gray-100" />
                <button onClick={() => deletePhoto(p)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center">
                  <X size={10} className="text-white" />
                </button>
              </div>
            ))}
            <button onClick={() => photoInputRef.current?.click()} disabled={uploading}
              className="w-16 h-16 flex-shrink-0 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-300 active:bg-gray-50 disabled:opacity-50">
              <Plus size={18} />
              <span className="text-[9px] mt-0.5">{uploading ? '...' : 'Add'}</span>
            </button>
          </div>
        </div>

        {/* Products */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-brand-navy uppercase tracking-wide">
              Products ({products.length})
            </span>
            <button onClick={() => navigate(`/products/new?request_id=${id}`)}
              className="text-brand-blue text-sm font-medium active:opacity-70">
              + Add Product
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
                <Link key={p.id} to={`/products/${p.id}`}
                  className="flex items-center px-4 py-4 active:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-brand-navy">{p.name}</span>
                      {p.is_draft && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Draft</span>
                      )}
                    </div>
                    {p.assigned_to && (
                      <div className="text-xs text-gray-400 mt-0.5">Assigned: {p.assigned_to}</div>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-gray-300 flex-shrink-0 ml-2" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Delete project */}
        <button onClick={handleDeleteRequest}
          className="w-full flex items-center justify-center gap-2 text-red-400 text-sm py-3 active:opacity-70 font-medium">
          <Trash2 size={15} /> Delete Project
        </button>

      </div>
    </div>
  )
}

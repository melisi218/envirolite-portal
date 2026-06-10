import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Trash2 } from 'lucide-react'

export default function BuyerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [original, setOriginal] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    supabase.from('companies').select('name').eq('id', id).single().then(({ data }) => {
      if (data) { setName(data.name); setOriginal(data.name) }
      setLoading(false)
    })
  }, [id])

  async function handleSave(e) {
    e.preventDefault()
    if (!name.trim() || name === original) return
    setSaving(true)
    await supabase.from('companies').update({ name: name.trim() }).eq('id', id)
    setOriginal(name.trim())
    setSaving(false)
  }

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('companies').delete().eq('id', id)
    navigate('/companies')
  }

  if (loading) return null

  return (
    <div className="min-h-screen bg-brand-light">
      {/* Header */}
      <div className="bg-brand-navy px-5 pt-4 pb-5 flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 flex-shrink-0">
          <ArrowLeft size={18} className="text-white" />
        </button>
        <h1 className="text-white text-xl font-semibold flex-1">{original}</h1>
      </div>

      <div className="px-4 pt-5 space-y-4">
        {/* Edit name */}
        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm p-4">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Buyer Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
          <button type="submit" disabled={saving || name === original || !name.trim()}
            className="w-full mt-3 bg-brand-blue text-white rounded-xl py-3.5 text-base font-semibold active:opacity-80 disabled:opacity-40">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* Delete */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center px-4 py-4 active:bg-gray-50">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center mr-3">
                <Trash2 size={16} className="text-red-500" />
              </div>
              <span className="text-sm font-medium text-red-500">Delete Buyer</span>
            </button>
          ) : (
            <div className="px-4 py-4">
              <p className="text-sm text-gray-600 mb-3">Delete <strong>{original}</strong> and all their requests? This can't be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)}
                  className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-500 active:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 bg-red-500 text-white rounded-xl py-3 text-sm font-semibold active:opacity-80 disabled:opacity-50">
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

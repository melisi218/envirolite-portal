import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Bell, CheckCheck } from 'lucide-react'

export default function Notifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('notifications')
      .select('*, products(id, name, request_id)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    setNotifications(data || [])
    setLoading(false)

    // Mark all as read
    await supabase.from('notifications').update({ read: true })
      .eq('user_id', user.id).eq('read', false)
  }

  useEffect(() => { load() }, [])

  function timeAgo(ts) {
    const diff = Date.now() - new Date(ts).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="min-h-screen bg-brand-light">
      <div className="bg-brand-navy px-5 pt-4 pb-5 flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 flex-shrink-0">
          <ArrowLeft size={18} className="text-white" />
        </button>
        <h1 className="text-white text-xl font-semibold flex-1">Notifications</h1>
        {notifications.length > 0 && (
          <span className="text-brand-blue/80 text-xs">
            <CheckCheck size={14} className="inline mr-1" />All read
          </span>
        )}
      </div>

      <div className="px-4 pt-4">
        {loading ? null : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm py-16 text-center">
            <Bell size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
            {notifications.map(n => (
              <Link
                key={n.id}
                to={n.products?.request_id ? `/requests/${n.products.request_id}` : '/requests'}
                className={`flex items-start gap-3 px-4 py-4 active:bg-gray-50 ${!n.read ? 'bg-blue-50/50' : ''}`}
              >
                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${!n.read ? 'bg-brand-blue' : 'bg-transparent'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-brand-navy leading-snug">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

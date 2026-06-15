import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { House, ClipboardList, Settings } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Layout({ children }) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let channel

    async function loadUnread() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)

      setUnreadCount(count || 0)

      // Realtime: listen for new notifications for this user
      channel = supabase
        .channel('notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, () => {
          setUnreadCount(c => c + 1)
        })
        .subscribe()
    }

    loadUnread()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [])

  const tabs = [
    { to: '/', label: 'Home', icon: House },
    { to: '/requests', label: 'Requests', icon: ClipboardList },
    { to: unreadCount > 0 ? '/notifications' : '/settings', label: 'Settings', icon: Settings, badge: unreadCount },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-brand-light">
      <div className="bg-brand-navy" style={{ height: 'max(env(safe-area-inset-top), 44px)' }} />

      <div className="flex-1 pb-tab scroll-native">
        {children}
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex">
          {tabs.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors min-h-[49px] ${
                  isActive ? 'text-brand-blue' : 'text-gray-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                    {badge > 0 && (
                      <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  )
}

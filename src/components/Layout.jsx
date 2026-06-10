import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, Settings } from 'lucide-react'

const tabs = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/requests', label: 'Requests', icon: ClipboardList },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-brand-light">
      {/* Status bar spacer — min 44px (notch iPhones) or 59px (Dynamic Island), falls back to safe-area-inset-top in PWA */}
      <div className="bg-brand-navy" style={{ height: 'max(env(safe-area-inset-top), 44px)' }} />

      {/* Page content */}
      <div className="flex-1 pb-tab scroll-native">
        {children}
      </div>

      {/* Bottom Tab Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex">
          {tabs.map(({ to, label, icon: Icon }) => (
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
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
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

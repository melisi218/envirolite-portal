import { X } from 'lucide-react'

export default function Sheet({ open, onClose, title, children, tall }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end sheet-overlay">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className={`relative bg-white rounded-t-2xl sheet-panel w-full ${tall ? 'max-h-[92vh]' : 'max-h-[80vh]'} flex flex-col`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-9 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-brand-navy">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 scroll-native">
          {children}
        </div>
      </div>
    </div>
  )
}

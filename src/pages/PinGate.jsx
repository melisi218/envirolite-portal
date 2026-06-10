import { useState } from 'react'

const CORRECT_PIN = import.meta.env.VITE_APP_PIN || '1234'

export default function PinGate({ onUnlock }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  const handleDigit = (digit) => {
    if (pin.length >= 4) return
    const next = pin + digit
    setPin(next)
    setError(false)
    if (next.length === 4) {
      setTimeout(() => {
        if (next === CORRECT_PIN) {
          onUnlock()
        } else {
          setShake(true)
          setError(true)
          setTimeout(() => { setPin(''); setShake(false) }, 600)
        }
      }, 150)
    }
  }

  const handleBackspace = () => { setPin(p => p.slice(0, -1)); setError(false) }

  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-brand-navy safe-top safe-bottom" style={{paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)'}}>
      {/* Top spacer */}
      <div className="flex-1" />

      {/* Logo */}
      <div className="text-center mb-12">
        <div className="text-white text-4xl font-light tracking-[0.2em] mb-1">ENVIROLITE</div>
        <div className="text-brand-blue text-xs font-medium tracking-[0.4em] uppercase">Portal</div>
      </div>

      {/* Dots */}
      <div className={`flex gap-5 mb-3 ${shake ? 'animate-bounce' : ''}`}>
        {[0,1,2,3].map(i => (
          <div key={i} className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
            i < pin.length
              ? error ? 'bg-red-400 border-red-400' : 'bg-brand-blue border-brand-blue'
              : 'border-white/30'
          }`} />
        ))}
      </div>

      <div className="h-6 mb-2">
        {error && <p className="text-red-400 text-sm text-center">Incorrect PIN</p>}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 px-10 w-full max-w-xs mb-4">
        {keys.map((k, i) => {
          if (k === '') return <div key={i} />
          if (k === '⌫') return (
            <button key={i} onClick={handleBackspace}
              className="h-16 rounded-2xl bg-white/10 active:bg-white/20 text-white text-xl flex items-center justify-center transition-colors">
              ⌫
            </button>
          )
          return (
            <button key={i} onClick={() => handleDigit(k)}
              className="h-16 rounded-2xl bg-white/10 active:bg-white/20 text-white text-2xl font-light transition-colors">
              {k}
            </button>
          )
        })}
      </div>

      <div className="flex-1" />
      <p className="text-white/20 text-xs mb-6">Internal use only</p>
    </div>
  )
}

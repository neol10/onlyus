import { useState } from 'react'

export default function LockScreen({ photo, expectedPin, onUnlock }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  const handlePress = (num) => {
    if (input.length >= 4) return
    const nextInput = input + num
    setInput(nextInput)
    if (nextInput.length === 4) {
      if (nextInput === expectedPin) {
        onUnlock()
      } else {
        setError(true)
        setTimeout(() => {
          setInput('')
          setError(false)
        }, 500)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 text-white" style={photo ? { backgroundImage: `url(${photo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" />
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white/10 shadow-lg backdrop-blur-lg">
          <svg className="h-8 w-8 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <div className="flex gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`h-4 w-4 rounded-full border-2 transition-all duration-300 ${i < input.length ? 'bg-white border-white scale-110' : 'border-white/50 bg-transparent'} ${error ? 'bg-rose-500 border-rose-500 animate-pulse' : ''}`} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-6 mt-6">
          {[1,2,3,4,5,6,7,8,9].map(num => (
            <button key={num} onClick={() => handlePress(num.toString())} className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl font-semibold backdrop-blur-md transition active:scale-90 active:bg-white/20">
              {num}
            </button>
          ))}
          <div />
          <button onClick={() => handlePress('0')} className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl font-semibold backdrop-blur-md transition active:scale-90 active:bg-white/20">
            0
          </button>
          <button onClick={() => setInput(prev => prev.slice(0, -1))} className="flex h-16 w-16 items-center justify-center rounded-full text-white/70 transition active:scale-90 active:text-white">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" /></svg>
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'

export default function LoveTimer({ startDate }) {
  const [time, setTime] = useState({ years: 0, months: 0, days: 0, hours: 0, mins: 0, secs: 0 })

  useEffect(() => {
    if (!startDate) return
    const target = new Date(startDate).getTime()
    
    const update = () => {
      const now = new Date().getTime()
      let diff = Math.floor((now - target) / 1000)
      if (diff < 0) diff = 0
      
      const years = Math.floor(diff / (365.25 * 86400))
      diff -= years * (365.25 * 86400)
      const months = Math.floor(diff / (30.44 * 86400))
      diff -= months * (30.44 * 86400)
      const days = Math.floor(diff / 86400)
      diff -= days * 86400
      const hours = Math.floor(diff / 3600)
      diff -= hours * 3600
      const mins = Math.floor(diff / 60)
      const secs = diff - mins * 60

      setTime({ years, months, days, hours, mins, secs })
    }
    
    update()
    const int = setInterval(update, 1000)
    return () => clearInterval(int)
  }, [startDate])

  if (!startDate) return null

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <TimeUnit val={time.years} label="Anos" />
      <TimeUnit val={time.months} label="Meses" />
      <TimeUnit val={time.days} label="Dias" />
      <TimeUnit val={time.hours} label="Hrs" />
      <TimeUnit val={time.mins} label="Min" />
      <TimeUnit val={time.secs} label="Seg" />
    </div>
  )
}

function TimeUnit({ val, label }) {
  return (
    <div className="flex flex-col items-center justify-center min-w-[50px] bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-xl p-2 shadow-sm border border-white/50 dark:border-slate-700/50">
      <span className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white tabular-nums tracking-tighter leading-none">
        {String(val).padStart(2, '0')}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">
        {label}
      </span>
    </div>
  )
}

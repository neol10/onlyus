import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../src/context/ToastContext'

function getBodasTitle(totalMonths) {
  const titles = {
    1: "Bodas de Beijinhos 💋",
    2: "Bodas de Sorvete 🍦",
    3: "Bodas de Algodão-Doce ☁️",
    4: "Bodas de Pipoca 🍿",
    5: "Bodas de Chocolate 🍫",
    6: "Bodas de Plumas ☁️",
    7: "Bodas de Purpurina ✨",
    8: "Bodas de Pompom 🧶",
    9: "Bodas de Pirulito 🍭",
    10: "Bodas de Pintinhos 🐥",
    11: "Bodas de Chicletes 🍬",
    12: "Bodas de Milagre 🏆 (1 Ano)",
    24: "Bodas de Dedo-de-Moça 🌶️ (2 Anos)",
    36: "Bodas de Cristal 💎 (3 Anos)",
    48: "Bodas de Quartzo Azul 💙 (4 Anos)",
    60: "Bodas de Paixão ❤️ (5 Anos)",
    72: "Bodas de Rosas 🌹 (6 Anos)",
    84: "Bodas de Tulipas 🌷 (7 Anos)",
    96: "Bodas de Flor de Jade 🌿 (8 Anos)",
    108: "Bodas de Orquídeas 🌸 (9 Anos)",
    120: "Bodas de Milagre 🔟 (10 Anos)",
    132: "Bodas de Quartzo Rosa 💖 (11 Anos)",
    144: "Bodas de Estrela-do-Mar ⭐ (12 Anos)",
    156: "Bodas de Linho 🧵 (13 Anos)",
    168: "Bodas de Marfim 🐘 (14 Anos)",
    180: "Bodas de Amor Eterno ♾️ (15 Anos)"
  }

  if (titles[totalMonths]) return titles[totalMonths]
  
  if (totalMonths > 0 && totalMonths % 12 === 0) {
    const years = totalMonths / 12
    return `Bodas de ${years} Anos 🏆`
  }

  return `Nível ${totalMonths} 💘`
}

export default function LoveTimer({ startDate }) {
  const { showToast } = useToast()
  const [time, setTime] = useState({ years: 0, months: 0, days: 0, hours: 0, mins: 0, secs: 0 })
  const [showCelebration, setShowCelebration] = useState(false)

  const levelInfo = useMemo(() => {
    const totalMonths = (time.years * 12) + time.months
    const title = getBodasTitle(totalMonths)
    const daysInMonth = 30.44
    const progress = (time.days / daysInMonth) * 100
    return { level: totalMonths, title, progress: Math.min(progress, 100) }
  }, [time])

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

      // Detectar aniversário (0 dias, 0 horas, 0 mins)
      if (days === 0 && hours === 0 && mins === 0 && secs < 5) {
        const lastCel = localStorage.getItem('last-anniversary-cel')
        const currentId = `${years}-${months}`
        if (lastCel !== currentId) {
          setShowCelebration(true)
          const title = getBodasTitle((years * 12) + months)
          showToast(`LEVEL UP! 🎊 ${title}`, 'success')
          localStorage.setItem('last-anniversary-cel', currentId)
          setTimeout(() => setShowCelebration(false), 8000)
        }
      }
    }
    
    update()
    const int = setInterval(update, 1000)
    return () => clearInterval(int)
  }, [startDate, showToast])

  if (!startDate) return null

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2.5 flex-wrap items-center">
        <TimeUnit val={time.years} label="Anos" />
        <TimeUnit val={time.months} label="Meses" />
        <TimeUnit val={time.days} label="Dias" />
        <TimeUnit val={time.hours} label="Hrs" />
        <TimeUnit val={time.mins} label="Min" />
        <TimeUnit val={time.secs} label="Seg" />
      </div>

      {/* Gamified Level Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="soft-card p-5 relative overflow-hidden group border border-rose-500/10"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
                <span className="text-white text-lg font-black tracking-tighter">Lvl</span>
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-800 dark:text-white leading-tight">{levelInfo.title}</h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nível {levelInfo.level}</p>
              </div>
            </div>
            
            <div className="text-right">
              <span className="text-2xl font-black text-rose-500 italic">
                {Math.floor(levelInfo.progress)}%
              </span>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <div className="h-3 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${levelInfo.progress}%` }}
                className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.4)] relative"
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-shine_2s_linear_infinite]" />
              </motion.div>
            </div>
            <div className="flex justify-between px-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nível {levelInfo.level}</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nível {levelInfo.level + 1}</span>
            </div>
          </div>
        </div>

        {/* Floating Icons Decors */}
        <div className="absolute -top-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
          <svg className="w-24 h-24 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      </motion.div>

      <style jsx>{`
        @keyframes progress-shine {
          0% { background-position: 0 0; }
          100% { background-position: 40px 0; }
        }
      `}</style>

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          >
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl p-8 rounded-[3rem] shadow-[0_0_50px_rgba(244,63,94,0.3)] border-2 border-rose-500/20 text-center">
              <motion.div 
                animate={{ y: [-10, 10, -10] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 italic">LEVEL UP!</h2>
              <p className="text-rose-500 font-bold uppercase tracking-widest text-xs">
                {levelInfo.title}
              </p>
              <div className="mt-4 text-slate-600 dark:text-slate-400 text-sm font-medium">
                Parabéns por mais um nível de amor! <br/> Vocês alcançaram as <b>{levelInfo.title}</b> ❤️
              </div>
            </div>
            
            {/* Partículas Simples */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{ 
                  x: (Math.random() - 0.5) * 800, 
                  y: (Math.random() - 0.5) * 800,
                  opacity: 0,
                  rotate: 360
                }}
                transition={{ duration: 3, ease: "easeOut" }}
                className="absolute w-2 h-2 rounded-full bg-rose-500"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TimeUnit({ val, label }) {
  return (
    <div className="flex flex-col items-center justify-center min-w-[50px] bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-xl p-2 shadow-sm border border-white/50 dark:border-slate-700/50">
      <span className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white tabular-nums tracking-tighter leading-none">
        {String(val).padStart(2, '0')}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300 mt-1">
        {label}
      </span>
    </div>
  )
}

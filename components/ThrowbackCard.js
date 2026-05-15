import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function ThrowbackCard({ posts }) {
  const [throwback, setThrowback] = useState(null)

  useEffect(() => {
    if (!posts || posts.length < 3) return
    // Pega posts mais antigos pra dar sensação de nostalgia
    const olderPosts = posts.slice(1)
    if (olderPosts.length > 0) {
      const random = olderPosts[Math.floor(Math.random() * olderPosts.length)]
      setThrowback(random)
    }
  }, [posts])

  if (!throwback) return null

  return (
    <div className="soft-card p-4 sm:p-5 group relative overflow-hidden border border-[var(--ou-accent-soft)]">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--ou-accent)]/10 to-transparent opacity-50"></div>
      <div className="relative z-10 flex items-center gap-4">
        {throwback.images && throwback.images.length > 0 && (
          <div className="shrink-0">
            <img src={throwback.images[0]} alt="Throwback" className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shadow-md rotate-3 group-hover:rotate-6 transition-transform duration-300" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[var(--ou-accent)] flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Máquina do Tempo
          </span>
          <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-200 mt-1 truncate">
            {throwback.caption || "Relembre esse momento especial..."}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {new Date(throwback.createdAt?.toDate ? throwback.createdAt.toDate() : throwback.createdAt).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  )
}

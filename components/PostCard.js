import { useState, useEffect } from 'react'
import { useAuth } from '../src/context/AuthContext'

export default function PostCard({ post = {}, settings = {} }) {
  const { user } = useAuth()
  const { caption = '', images = [], authorId = null, isBlurred: postBlurred = false, isLocked: postLocked = false } = post
  const [isBlurred, setIsBlurred] = useState(postBlurred || settings.blurPhotos || false)
  const [unlocked, setUnlocked] = useState(!postLocked)

  useEffect(() => {
    setIsBlurred(postBlurred || settings.blurPhotos || false)
  }, [settings.blurPhotos, postBlurred])

  if (!unlocked) {
    return (
      <article className="soft-card p-8 text-center flex flex-col items-center justify-center bg-slate-900 text-white min-h-[200px]">
        <svg className="w-8 h-8 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        <p className="text-sm font-bold mb-4">Postagem Protegida</p>
        <button 
          onClick={() => {
            const pin = prompt('Digite o PIN de segurança para ver esta postagem:')
            if (pin === settings.pinCode) setUnlocked(true)
            else alert('PIN incorreto')
          }}
          className="text-xs bg-white text-slate-900 px-4 py-2 rounded-full font-bold"
        >
          Ver Postagem
        </button>
      </article>
    )
  }

  return (
    <article className="soft-card overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
      <header className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'color-mix(in srgb, var(--ou-accent-soft, rgba(99,102,241,0.14)) 50%, rgba(255,255,255,0.72))' }}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-400 to-rose-600 text-sm font-semibold text-white shadow-lg shadow-pink-950/10">
            {post.authorId === user?.uid 
              ? (settings.displayName ? settings.displayName.slice(0, 2).toUpperCase() : 'VC') 
              : (settings.partnerNick ? settings.partnerNick.slice(0, 2).toUpperCase() : 'AM')}
          </div>
          <div>
            <div className="font-semibold text-slate-950 dark:text-white flex items-center gap-1">
              {post.authorId === user?.uid ? (settings.displayName || 'Você') : (settings.partnerNick || 'O Amor')}
              {post.notifyPartner && post.authorId !== user?.uid && (
                <span className="text-[11px] font-medium text-pink-500 lowercase">— com você 💖</span>
              )}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">
              {post.createdAt ? new Date(post.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : ''}
            </div>
          </div>
        </div>
        {post.notifyPartner && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>
          </div>
        )}
      </header>
      <div className="px-5 pt-4 text-[15px] leading-7 text-slate-700 dark:text-slate-300">{caption}</div>
      {images && images.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-2 px-5 relative">
          {images.map((src, i) => (
            <div key={i} className="relative overflow-hidden rounded-3xl" onClick={() => setIsBlurred(false)}>
              <img 
                src={src} 
                alt={`imagem-${i}`} 
                className={`max-h-[520px] w-full object-cover shadow-lg shadow-slate-950/10 ring-1 ring-white/50 transition-all duration-500 ${isBlurred ? 'blur-2xl scale-110 cursor-pointer' : 'blur-0 scale-100'}`} 
              />
              {isBlurred && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm cursor-pointer">
                  <div className="bg-white/90 px-4 py-2 rounded-full text-xs font-bold text-slate-900 shadow-xl">Toque para ver</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <footer className="mt-5 flex items-center justify-between border-t px-5 py-4 text-sm text-slate-500" style={{ borderColor: 'color-mix(in srgb, var(--ou-accent-soft, rgba(99,102,241,0.14)) 50%, rgba(255,255,255,0.72))' }}>
        <div className="flex items-center gap-4">
          <span>Curtir</span>
          <span>Comentar</span>
        </div>
        <span className="theme-pill px-3 py-1 text-xs font-semibold text-slate-600" style={{ borderRadius: '999px' }}>Compartilhado</span>
      </footer>
    </article>
  )
}

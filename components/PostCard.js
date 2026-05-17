import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../src/context/AuthContext'
import { db } from '../src/firebase/firebaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore'

export default function PostCard({ post = {}, settings = {} }) {
  const { user, profile } = useAuth()
  const { 
    id: postId, 
    caption = '', 
    images = [], 
    authorId = null, 
    isBlurred: postBlurred = false, 
    isLocked: postLocked = false,
    likes = [],
    comments = []
  } = post
  const [isBlurred, setIsBlurred] = useState(postBlurred || settings.blurPhotos || false)
  const [unlocked, setUnlocked] = useState(!postLocked)
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isLiking, setIsLiking] = useState(false)
  const [localLikes, setLocalLikes] = useState(likes)
  // Carrossel
  const [currentSlide, setCurrentSlide] = useState(0)
  const touchStartX = useRef(null)

  useEffect(() => {
    setLocalLikes(likes)
  }, [likes])
  const [isEditing, setIsEditing] = useState(false)
  const [editCaption, setEditCaption] = useState(caption)

  const handleDelete = async () => {
    if (!profile?.coupleId || !postId) return
    if (confirm('Tem certeza que deseja excluir esta lembrança?')) {
      try {
        const postRef = doc(db, 'couples', profile.coupleId, 'posts', postId)
        await deleteDoc(postRef)
      } catch (err) {
        console.error('Erro ao excluir:', err)
        alert('Erro ao excluir postagem')
      }
    }
  }

  const handleUpdate = async () => {
    if (!profile?.coupleId || !postId) return
    try {
      const postRef = doc(db, 'couples', profile.coupleId, 'posts', postId)
      await updateDoc(postRef, { caption: editCaption })
      setIsEditing(false)
    } catch (err) {
      console.error('Erro ao editar:', err)
      alert('Erro ao editar postagem')
    }
  }

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
        <div className="flex items-center gap-3">
          {post.authorId === user?.uid && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-indigo-500 transition-colors"
                title="Editar postagem"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <button 
                onClick={handleDelete}
                className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                title="Excluir postagem"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          )}
          {post.notifyPartner && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>
            </div>
          )}
        </div>
      </header>
      {isEditing ? (
        <div className="px-5 pt-4">
          <textarea 
            value={editCaption}
            onChange={(e) => setEditCaption(e.target.value)}
            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px]"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-xs font-bold text-slate-500">Cancelar</button>
            <button onClick={handleUpdate} className="bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20">Salvar Alterações</button>
          </div>
        </div>
      ) : (
        <div className="px-5 pt-4 text-[15px] leading-7 text-slate-700 dark:text-slate-300">{caption}</div>
      )}
      {images && images.length > 0 && (
        <div className="mt-4 relative select-none">
          {/* Container do carrossel */}
          <div
            className="relative overflow-hidden"
            onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
            onTouchEnd={e => {
              if (touchStartX.current === null) return
              const diff = touchStartX.current - e.changedTouches[0].clientX
              if (Math.abs(diff) > 40) {
                if (diff > 0) setCurrentSlide(s => Math.min(s + 1, images.length - 1))
                else setCurrentSlide(s => Math.max(s - 1, 0))
              }
              touchStartX.current = null
            }}
          >
            {/* Faixa de slides */}
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {images.map((src, i) => (
                <div key={i} className="w-full flex-shrink-0 relative" onClick={() => isBlurred && setIsBlurred(false)}>
                  <img
                    src={src}
                    alt={`foto-${i + 1}`}
                    loading="lazy"
                    decoding="async"
                    className={`w-full max-h-[520px] object-cover transition-all duration-500 ${
                      isBlurred ? 'blur-2xl scale-110 cursor-pointer' : 'blur-0 scale-100'
                    }`}
                  />
                  {isBlurred && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm cursor-pointer">
                      <div className="bg-white/90 px-4 py-2 rounded-full text-xs font-bold text-slate-900 shadow-xl">Toque para ver</div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Seta esquerda */}
            {images.length > 1 && currentSlide > 0 && (
              <button
                type="button"
                onClick={() => setCurrentSlide(s => s - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-sm transition hover:bg-black/60 active:scale-90"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </button>
            )}

            {/* Seta direita */}
            {images.length > 1 && currentSlide < images.length - 1 && (
              <button
                type="button"
                onClick={() => setCurrentSlide(s => s + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-sm transition hover:bg-black/60 active:scale-90"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </button>
            )}

            {/* Contador top-right estilo Instagram */}
            {images.length > 1 && (
              <div className="absolute top-2.5 right-3 bg-black/50 text-white text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-sm">
                {currentSlide + 1}/{images.length}
              </div>
            )}
          </div>

          {/* Dots de navegação */}
          {images.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-3">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentSlide(i)}
                  className={`rounded-full transition-all duration-200 ${
                    i === currentSlide
                      ? 'w-4 h-1.5 bg-indigo-500'
                      : 'w-1.5 h-1.5 bg-slate-300 dark:bg-white/20 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
      <footer className="mt-5 border-t px-5 py-3" style={{ borderColor: 'color-mix(in srgb, var(--ou-accent-soft, rgba(99,102,241,0.14)) 50%, rgba(255,255,255,0.72))' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={async () => {
                if (isLiking || !profile?.coupleId) return
                
                // Lógica Otimista: Atualiza localmente NA HORA
                const hasLiked = localLikes.includes(user?.uid)
                const newLikes = hasLiked 
                  ? localLikes.filter(id => id !== user?.uid)
                  : [...localLikes, user?.uid]
                
                setLocalLikes(newLikes)
                setIsLiking(true)

                try {
                  const postRef = doc(db, 'couples', profile.coupleId, 'posts', postId)
                  await updateDoc(postRef, {
                    likes: hasLiked ? arrayRemove(user?.uid) : arrayUnion(user?.uid)
                  })
                } catch (err) {
                  console.error('Erro ao curtir:', err)
                  setLocalLikes(likes) // Reverte em caso de erro
                } finally {
                  setIsLiking(false)
                }
              }}
              className="group flex items-center gap-2 text-sm font-bold transition-colors"
            >
              <motion.div
                whileTap={{ scale: 0.7 }}
                animate={{ 
                  scale: localLikes.includes(user?.uid) ? [1, 1.4, 1] : 1,
                }}
                transition={{ duration: 0.3 }}
                className={localLikes.includes(user?.uid) ? 'text-rose-500' : 'text-slate-500 group-hover:text-rose-500'}
              >
                <svg className={`h-6 w-6 ${localLikes.includes(user?.uid) ? 'fill-current' : 'fill-none stroke-current stroke-2'}`} viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </motion.div>
              <span className={localLikes.includes(user?.uid) ? 'text-rose-500' : 'text-slate-500'}>
                {localLikes.length || 0}
              </span>
            </button>

            <button 
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-500 transition-colors"
            >
              <svg className="h-5 w-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
              </svg>
              <span>{comments.length || 0}</span>
            </button>
          </div>
          <span className="theme-pill px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest" style={{ borderRadius: '999px' }}>Memória</span>
        </div>

        {showComments && (
          <div className="mt-4 space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="space-y-3">
              {comments.map((c, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 dark:text-white">{c.authorName}:</span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">{c.text}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 uppercase">{new Date(c.timestamp).toLocaleDateString()}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <input 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escreva um comentário..."
                className="flex-1 bg-slate-50 dark:bg-white/5 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && newComment.trim() && profile?.coupleId) {
                    const postRef = doc(db, 'couples', profile.coupleId, 'posts', postId)
                    await updateDoc(postRef, {
                      comments: arrayUnion({
                        text: newComment,
                        authorId: user.uid,
                        authorName: profile.displayName || 'Amor',
                        timestamp: Date.now()
                      })
                    })
                    setNewComment('')
                  }
                }}
              />
              <button 
                onClick={async () => {
                  if (!newComment.trim() || !profile?.coupleId) return
                  const postRef = doc(db, 'couples', profile.coupleId, 'posts', postId)
                  await updateDoc(postRef, {
                    comments: arrayUnion({
                      text: newComment,
                      authorId: user.uid,
                      authorName: profile.displayName || 'Amor',
                      timestamp: Date.now()
                    })
                  })
                  setNewComment('')
                }}
                className="bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold"
              >
                Enviar
              </button>
            </div>
          </div>
        )}
      </footer>
    </article>
  )
}

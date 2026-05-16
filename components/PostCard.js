import { useState, useEffect } from 'react'
import { useAuth } from '../src/context/AuthContext'
import { db } from '../src/firebase/firebaseClient'
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'

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
      <footer className="mt-5 border-t px-5 py-3" style={{ borderColor: 'color-mix(in srgb, var(--ou-accent-soft, rgba(99,102,241,0.14)) 50%, rgba(255,255,255,0.72))' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={async () => {
                if (isLiking || !profile?.coupleId) return
                setIsLiking(true)
                const postRef = doc(db, 'couples', profile.coupleId, 'posts', postId)
                const hasLiked = likes.includes(user?.uid)
                await updateDoc(postRef, {
                  likes: hasLiked ? arrayRemove(user?.uid) : arrayUnion(user?.uid)
                })
                setIsLiking(false)
              }}
              className={`flex items-center gap-2 text-sm font-bold transition-colors ${likes.includes(user?.uid) ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'}`}
            >
              <svg className={`h-5 w-5 ${likes.includes(user?.uid) ? 'fill-current' : 'fill-none stroke-current stroke-2'}`} viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span>{likes.length || 0}</span>
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

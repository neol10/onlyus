import { useState, useEffect } from 'react'
import { doc, updateDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../src/firebase/firebaseClient'
import { motion, AnimatePresence } from 'framer-motion'

export default function MusicCard({ coupleId }) {
  const [musicUrl, setMusicUrl] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [trackId, setTrackId] = useState('')

  useEffect(() => {
    if (!coupleId || !db) return
    
    const coupleRef = doc(db, 'couples', coupleId)
    const unsub = onSnapshot(coupleRef, (docSnap) => {
      if (docSnap.exists()) {
        const url = docSnap.data().musicOfDay || ''
        setMusicUrl(url)
        extractTrackId(url)
      }
    })

    return () => unsub()
  }, [coupleId])

  const extractTrackId = (url) => {
    if (!url) {
      setTrackId('')
      return
    }
    // Suporta links como: https://open.spotify.com/track/ID?si=...
    const match = url.match(/track\/([a-zA-Z0-9]+)/)
    if (match && match[1]) {
      setTrackId(match[1])
    } else {
      setTrackId('')
    }
  }

  const handleSave = async () => {
    if (!coupleId) return
    const coupleRef = doc(db, 'couples', coupleId)
    await updateDoc(coupleRef, {
      musicOfDay: musicUrl
    })
    setIsEditing(false)
  }

  return (
    <div className="soft-card p-5 relative overflow-hidden group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1DB954] rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.646 14.413c-.187.305-.583.402-.888.215-2.486-1.52-5.615-1.864-9.303-1.02a.625.625 0 01-.275-1.218c4.032-.915 7.498-.518 10.25 1.168.306.187.404.584.216.889zm1.238-2.723c-.234.382-.734.504-1.115.269-2.845-1.748-7.186-2.257-10.55-1.238a.78.78 0 01-.452-1.493c3.85-1.168 8.643-.597 11.848 1.369.38.235.502.735.269 1.115zm.118-2.894c-.28.46-.884.606-1.344.325C14.733 9.043 9.49 8.868 6.13 9.888a.936.936 0 11-.538-1.79c3.923-1.192 9.713-.993 13.344 1.163.46.279.606.883.325 1.343z"/>
            </svg>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Música do Dia
          </span>
        </div>
        
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="text-[10px] font-bold uppercase text-indigo-500 hover:text-indigo-600 transition-colors"
        >
          {isEditing ? 'Cancelar' : 'Alterar'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div 
            key="edit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <input 
              type="text"
              placeholder="Cole o link da música aqui..."
              value={musicUrl}
              onChange={(e) => setMusicUrl(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB954]/50 transition-all"
            />
            <button 
              onClick={handleSave}
              className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-[#1DB954]/20 transition-all active:scale-95"
            >
              Definir Música ❤️
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl overflow-hidden shadow-inner bg-black/5 dark:bg-black/20"
          >
            {trackId ? (
              <iframe 
                src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`} 
                width="100%" 
                height="152" 
                frameBorder="0" 
                allowFullScreen="" 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                loading="lazy"
                className="rounded-2xl"
              />
            ) : (
              <div className="h-[152px] flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50">
                <p className="text-sm text-slate-400 italic mb-3">Nenhuma música escolhida ainda...</p>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-bold text-indigo-500 underline underline-offset-4"
                >
                  Escolher agora
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decoração sutil de fundo */}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#1DB954] opacity-[0.03] rounded-full blur-3xl pointer-events-none" />
    </div>
  )
}

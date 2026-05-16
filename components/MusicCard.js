import { useState, useEffect } from 'react'
import { doc, updateDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../src/firebase/firebaseClient'
import { motion, AnimatePresence } from 'framer-motion'

export default function MusicCard({ coupleId }) {
  const [musicUrl, setMusicUrl] = useState('')
  const [musicNote, setMusicNote] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [trackId, setTrackId] = useState('')

  useEffect(() => {
    if (!coupleId || !db) return
    
    const coupleRef = doc(db, 'couples', coupleId)
    const unsub = onSnapshot(coupleRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        setMusicUrl(data.musicOfDay || '')
        setMusicNote(data.musicNote || '')
        extractTrackId(data.musicOfDay || '')
      }
    })

    return () => unsub()
  }, [coupleId])

  const extractTrackId = (url) => {
    if (!url) {
      setTrackId('')
      return
    }
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
      musicOfDay: musicUrl,
      musicNote: musicNote
    })
    setIsEditing(false)
  }

  return (
    <div className="soft-card p-4 relative overflow-hidden bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-900/80 dark:to-slate-900/40 backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#1DB954] rounded-full flex items-center justify-center shadow-md">
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.646 14.413c-.187.305-.583.402-.888.215-2.486-1.52-5.615-1.864-9.303-1.02a.625.625 0 01-.275-1.218c4.032-.915 7.498-.518 10.25 1.168.306.187.404.584.216.889zm1.238-2.723c-.234.382-.734.504-1.115.269-2.845-1.748-7.186-2.257-10.55-1.238a.78.78 0 01-.452-1.493c3.85-1.168 8.643-.597 11.848 1.369.38.235.502.735.269 1.115zm.118-2.894c-.28.46-.884.606-1.344.325C14.733 9.043 9.49 8.868 6.13 9.888a.936.936 0 11-.538-1.79c3.923-1.192 9.713-.993 13.344 1.163.46.279.606.883.325 1.343z"/>
            </svg>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Nota Musical
          </span>
        </div>
        
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="text-[9px] font-black uppercase text-indigo-500/80 hover:text-indigo-600 transition-colors"
        >
          {isEditing ? 'Fechar' : 'Editar Nota'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div 
            key="edit"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-2"
          >
            <input 
              type="text"
              placeholder="Sua mensagem (ex: Nossa parte em 01:20)"
              value={musicNote}
              onChange={(e) => setMusicNote(e.target.value)}
              maxLength={40}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
            <input 
              type="text"
              placeholder="Link da música no Spotify..."
              value={musicUrl}
              onChange={(e) => setMusicUrl(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#1DB954]/50"
            />
            <button 
              onClick={handleSave}
              className="w-full bg-gradient-to-r from-[#1DB954] to-indigo-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all"
            >
              Salvar Nota ❤️
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {musicNote && (
              <div className="relative inline-block mb-1">
                <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl text-[11px] font-medium text-slate-700 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-white/5 relative z-10">
                  {musicNote}
                </div>
                {/* Rabinho do balão de fala */}
                <div className="absolute -bottom-1 left-4 w-3 h-3 bg-white dark:bg-slate-800 border-r border-b border-slate-100 dark:border-white/5 rotate-45 z-0" />
              </div>
            )}

            {trackId ? (
              <div className="rounded-xl overflow-hidden shadow-inner border border-white/10">
                <iframe 
                  src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`} 
                  width="100%" 
                  height="80" 
                  frameBorder="0" 
                  allowFullScreen="" 
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                  loading="lazy"
                />
              </div>
            ) : (
              <div 
                onClick={() => setIsEditing(true)}
                className="h-20 flex items-center justify-center bg-slate-50 dark:bg-white/5 rounded-xl border border-dashed border-slate-300 dark:border-white/10 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
              >
                <span className="text-[11px] text-slate-400 font-medium">+ Adicionar nota musical</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

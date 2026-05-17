import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { collection, onSnapshot, query, orderBy, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../src/firebase/firebaseClient'
import { useAuth } from '../src/context/AuthContext'
import { useToast } from '../src/context/ToastContext'

export default function DreamList() {
  const { user, profile } = useAuth()
  const { showToast } = useToast()
  
  const [dreams, setDreams] = useState([])
  const [newDream, setNewDream] = useState('')
  const [loading, setLoading] = useState(true)

  // Escuta os sonhos da subcoleção em tempo real
  useEffect(() => {
    if (!user || !db || !profile?.coupleId) return

    const dreamsRef = collection(db, 'couples', profile.coupleId, 'dreams')
    const q = query(dreamsRef, orderBy('createdAt', 'desc'))

    const unsub = onSnapshot(q, (snapshot) => {
      setDreams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    })

    return () => unsub()
  }, [user, profile?.coupleId])

  // Adicionar um novo sonho
  const handleAddDream = async (e) => {
    e.preventDefault()
    if (!newDream.trim() || !profile?.coupleId) return

    try {
      const dreamsRef = collection(db, 'couples', profile.coupleId, 'dreams')
      await addDoc(dreamsRef, {
        title: newDream.trim(),
        completed: false,
        createdBy: user.uid,
        creatorNick: profile.displayName || 'Seu Amor',
        createdAt: Date.now()
      })
      showToast('Sonho adicionado à nossa lista! 🗺️✨')
      setNewDream('')
    } catch (err) {
      console.error(err)
      showToast('Erro ao adicionar sonho.', 'error')
    }
  }

  // Alternar estado de concluído
  const handleToggleComplete = async (dream) => {
    if (!profile?.coupleId) return
    const dreamRef = doc(db, 'couples', profile.coupleId, 'dreams', dream.id)

    try {
      const newStatus = !dream.completed
      await updateDoc(dreamRef, {
        completed: newStatus,
        completedAt: newStatus ? Date.now() : null,
        completedBy: newStatus ? user.uid : null,
        completedNick: newStatus ? (profile.displayName || 'Seu Amor') : null
      })
      
      if (newStatus) {
        showToast('Sonho realizado! Parabéns casal! 🎉❤️', 'success')
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([100, 50, 150])
        }
      } else {
        showToast('Sonho reaberto.')
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Deletar um sonho
  const handleDeleteDream = async (id) => {
    if (!profile?.coupleId) return
    const dreamRef = doc(db, 'couples', profile.coupleId, 'dreams', id)

    try {
      await deleteDoc(dreamRef)
      showToast('Meta removida.')
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <span className="animate-spin text-emerald-500 text-2xl">⏳</span>
      </div>
    )
  }

  const completedDreams = dreams.filter(d => d.completed)
  const pendingDreams = dreams.filter(d => !d.completed)

  return (
    <div className="space-y-6">
      {/* Card de Form de Adição */}
      <div className="soft-card p-5 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🗺️</span>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Adicionar Novo Sonho Conjunto</h3>
        </div>
        <form onSubmit={handleAddDream} className="flex gap-2">
          <input
            type="text"
            placeholder="Ex: Viajar para Paris, Ver a Aurora Boreal..."
            value={newDream}
            onChange={(e) => setNewDream(e.target.value)}
            className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
          />
          <button
            type="submit"
            disabled={!newDream.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl text-xs font-black shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            Adicionar ✨
          </button>
        </form>
      </div>

      {/* Lista de Metas */}
      <div className="space-y-4">
        {/* Metas Pendentes */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
            Planejando Conquistar ({pendingDreams.length})
          </h4>
          
          {pendingDreams.length === 0 ? (
            <div className="soft-card p-6 text-center text-xs text-slate-400 border-dashed border-slate-200 dark:border-white/5 bg-transparent">
              Nenhuma meta pendente. Que tal planejar algo legal hoje? 🌻
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {pendingDreams.map((dream) => (
                  <motion.div
                    key={dream.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="soft-card p-4 flex items-center justify-between gap-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm group border border-slate-100 dark:border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleComplete(dream)}
                        className="w-6 h-6 rounded-full border-2 border-emerald-400 flex items-center justify-center text-xs hover:bg-emerald-50 dark:hover:bg-emerald-500/10 active:scale-90 transition-all select-none"
                      >
                        🤍
                      </button>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{dream.title}</p>
                        <p className="text-[9px] text-slate-400">Adicionado por {dream.creatorNick}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteDream(dream.id)}
                      className="text-[9px] font-black text-rose-400 uppercase opacity-0 group-hover:opacity-100 active:scale-95 transition-opacity"
                    >
                      Remover
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Metas Realizadas */}
        {completedDreams.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
              Conquistado com Sucesso! 🏆 ({completedDreams.length})
            </h4>
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {completedDreams.map((dream) => (
                  <motion.div
                    key={dream.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="soft-card p-4 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/20 opacity-75 line-through border border-dashed border-emerald-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleComplete(dream)}
                        className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-xs text-white shadow-md active:scale-90 transition-all select-none border border-emerald-400"
                      >
                        ❤️
                      </button>
                      <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{dream.title}</p>
                        <p className="text-[9px] text-slate-400">
                          Realizado! 🎉 Conquistado em {new Date(dream.completedAt).toLocaleDateString()} por {dream.completedNick}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteDream(dream.id)}
                      className="text-[9px] font-black text-rose-400 uppercase hover:underline active:scale-95 transition-all"
                    >
                      Remover
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

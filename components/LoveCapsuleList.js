import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { collection, onSnapshot, query, orderBy, doc, addDoc } from 'firebase/firestore'
import { db } from '../src/firebase/firebaseClient'
import { useAuth } from '../src/context/AuthContext'
import { useToast } from '../src/context/ToastContext'

export default function LoveCapsuleList() {
  const { user, profile } = useAuth()
  const { showToast } = useToast()

  const [capsules, setCapsules] = useState([])
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [unlockDate, setUnlockDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)

  // Escuta as cápsulas do tempo em tempo real
  useEffect(() => {
    if (!user || !db || !profile?.coupleId) return

    const capsulesRef = collection(db, 'couples', profile.coupleId, 'capsules')
    const q = query(capsulesRef, orderBy('unlockTimestamp', 'asc'))

    const unsub = onSnapshot(q, (snapshot) => {
      setCapsules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    })

    return () => unsub()
  }, [user, profile?.coupleId])

  // Criar nova cápsula
  const handleCreateCapsule = async (e) => {
    e.preventDefault()
    if (!title.trim() || !message.trim() || !unlockDate || !profile?.coupleId) return

    const unlockTimestamp = new Date(unlockDate + 'T23:59:59').getTime()
    const now = Date.now()

    if (unlockTimestamp <= now) {
      showToast('A data de desbloqueio deve ser no futuro! ⏳', 'error')
      return
    }

    try {
      const capsulesRef = collection(db, 'couples', profile.coupleId, 'capsules')
      await addDoc(capsulesRef, {
        title: title.trim(),
        message: message.trim(),
        unlockTimestamp,
        unlockDate,
        createdBy: user.uid,
        creatorNick: profile.displayName || 'Seu Amor',
        createdAt: now
      })
      showToast('Cápsula do tempo selada com amor! 🔒⌛')
      setTitle('')
      setMessage('')
      setUnlockDate('')
      setIsAdding(false)
    } catch (err) {
      console.error(err)
      showToast('Erro ao criar cápsula.', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <span className="animate-spin text-amber-500 text-2xl">⏳</span>
      </div>
    )
  }

  const now = Date.now()
  const lockedCapsules = capsules.filter(c => c.unlockTimestamp > now)
  const unlockedCapsules = capsules.filter(c => c.unlockTimestamp <= now)

  return (
    <div className="space-y-6">
      {/* Botão de Abrir Criação */}
      <div className="flex justify-between items-center px-1">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Cápsulas do Tempo</h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
        >
          {isAdding ? 'Cancelar' : '+ Criar Nova Cápsula ⏳'}
        </button>
      </div>

      {/* Form de Criação */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreateCapsule} className="soft-card p-5 bg-gradient-to-br from-amber-500/5 to-yellow-500/5 border border-amber-500/10 space-y-3">
              <div>
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">Título do Momento / Ocasião</label>
                <input
                  type="text"
                  placeholder="Ex: Para abrir no nosso aniversário de 3 anos..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">Bilhete Secreto (O que vocês lerão no futuro)</label>
                <textarea
                  placeholder="Escreva aqui sua cartinha amorosa para o futuro..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 resize-none"
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">Data de Desbloqueio (Futuro)</label>
                <input
                  type="date"
                  value={unlockDate}
                  onChange={(e) => setUnlockDate(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-xl text-xs font-black shadow-md hover:scale-[1.02] active:scale-95 transition-all"
              >
                Selar e Trancar na Cápsula 🔒⌛
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de Cápsulas Trancadas */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
            Cápsulas Trancadas 🔒 ({lockedCapsules.length})
          </h4>

          {lockedCapsules.length === 0 ? (
            <div className="soft-card p-6 text-center text-xs text-slate-400 border-dashed border-slate-200 dark:border-white/5 bg-transparent">
              Nenhuma cápsula trancada no momento. Crie uma para o futuro!
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {lockedCapsules.map((capsule) => (
                <div
                  key={capsule.id}
                  className="soft-card p-4 relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/60 dark:to-slate-900/40 border border-slate-100 dark:border-white/5"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-[0.03] pointer-events-none">
                    <span className="text-7xl">🔒</span>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-xl text-amber-500 select-none shadow-sm">
                      🔒
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{capsule.title}</h5>
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Criada por {capsule.creatorNick}</p>
                      
                      {/* Contagem regressiva ativa */}
                      <div className="mt-3">
                        <Countdown targetTimestamp={capsule.unlockTimestamp} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lista de Cápsulas Desbloqueadas */}
        {unlockedCapsules.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
              Reveladas do Passado! 🔓 ({unlockedCapsules.length})
            </h4>

            <div className="space-y-3">
              {unlockedCapsules.map((capsule) => (
                <motion.div
                  key={capsule.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="soft-card p-5 bg-gradient-to-br from-amber-500/5 via-transparent to-yellow-500/5 border-2 border-dashed border-amber-500/30"
                >
                  <div className="flex items-center justify-between gap-4 mb-3 pb-2 border-b border-amber-500/10">
                    <div className="flex items-center gap-2">
                      <span className="text-xl animate-bounce">🔓</span>
                      <div>
                        <h5 className="text-xs font-black text-slate-800 dark:text-slate-100">{capsule.title}</h5>
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-wider">
                          Escrita por {capsule.creatorNick} em {new Date(capsule.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                      Revelada
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic whitespace-pre-line font-medium bg-white/50 dark:bg-white/5 p-3 rounded-xl border border-white/40 dark:border-white/5">
                    "{capsule.message}"
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Sub-componente de contagem regressiva viva e reativa
function Countdown({ targetTimestamp }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [isEnded, setIsEnded] = useState(false)

  useEffect(() => {
    const update = () => {
      const now = Date.now()
      const diff = targetTimestamp - now

      if (diff <= 0) {
        setIsEnded(true)
        return
      }

      const days = Math.floor(diff / (86400 * 1000))
      const hours = Math.floor((diff % (86400 * 1000)) / (3600 * 1000))
      const minutes = Math.floor((diff % (3600 * 1000)) / (60 * 1000))
      const seconds = Math.floor((diff % (60 * 1000)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds })
    }

    update()
    const int = setInterval(update, 1000)
    return () => clearInterval(int)
  }, [targetTimestamp])

  if (isEnded) {
    return <span className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-widest">Pronta para abrir! 🔓 Recarregue a página</span>
  }

  return (
    <div className="flex gap-1.5 flex-wrap items-center">
      <TimeUnit val={timeLeft.days} label="Dias" />
      <TimeUnit val={timeLeft.hours} label="Hrs" />
      <TimeUnit val={timeLeft.minutes} label="Min" />
      <TimeUnit val={timeLeft.seconds} label="Seg" />
    </div>
  )
}

function TimeUnit({ val, label }) {
  return (
    <div className="flex flex-col items-center justify-center min-w-[36px] bg-white/50 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-1 border border-white/50 dark:border-slate-700/50 shadow-sm">
      <span className="text-xs font-extrabold text-slate-800 dark:text-white tabular-nums leading-none">
        {String(val).padStart(2, '0')}
      </span>
      <span className="text-[7px] font-black uppercase tracking-wider text-slate-400 mt-0.5">
        {label}
      </span>
    </div>
  )
}

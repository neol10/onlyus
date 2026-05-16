import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import NavBar from '../components/NavBar'
import { useAuth } from '../src/context/AuthContext'
import { db } from '../src/firebase/firebaseClient'
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'

const PET_TYPES = {
  cat: { emoji: '🐱', color: 'from-orange-400 to-red-500', name: 'Gatinho' },
  dog: { emoji: '🐶', color: 'from-blue-400 to-indigo-500', name: 'Cachorrinho' },
  rabbit: { emoji: '🐰', color: 'from-pink-400 to-rose-500', name: 'Coelhinho' },
  bear: { emoji: '🐻', color: 'from-amber-600 to-orange-800', name: 'Ursinho' },
  panda: { emoji: '🐼', color: 'from-slate-400 to-slate-600', name: 'Panda' }
}

export default function PetPage() {
  const { user, profile, loading } = useAuth()
  const [petData, setPetData] = useState(null)
  const [showHearts, setShowHearts] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!profile?.coupleId) return

    const coupleRef = doc(db, 'couples', profile.coupleId)
    const unsub = onSnapshot(coupleRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        const now = new Date()
        const todayKey = now.toDateString() // "Fri May 16 2026"
        
        const pet = { 
          type: 'cat', 
          name: 'Bixinho', 
          level: 1, 
          exp: 0, 
          hunger: 100, 
          love: 100, 
          streak: 0,
          lastMissionDate: '', // Data da última vez que a missão dupla foi completa
          interactions: {}, // { [date]: { [uid]: 'feed'|'love' } }
          ...(data.pet || {})
        }

        // Lógica de Reset à Meia-Noite (Verifica se ontem a missão foi completa)
        const yesterday = new Date(now)
        yesterday.setDate(now.getDate() - 1)
        const yesterdayKey = yesterday.toDateString()

        // Se hoje é um novo dia e a missão de ontem não foi completa
        if (pet.lastMissionDate !== todayKey && pet.lastMissionDate !== yesterdayKey && pet.lastMissionDate !== '') {
          // Só reseta se já tinha um streak e passou o prazo
          if (pet.streak > 0) {
            pet.streak = 0
            pet.hunger = 30
            pet.love = 30
          }
        }

        setPetData(pet)
      }
    })
    return () => unsub()
  }, [profile?.coupleId])

  const updatePet = async (newPet) => {
    if (!profile?.coupleId || actionLoading) return
    setActionLoading(true)
    
    const coupleRef = doc(db, 'couples', profile.coupleId)
    await setDoc(coupleRef, { pet: newPet }, { merge: true })
    setActionLoading(false)
  }

  const handleAction = async (type) => {
    const today = new Date().toDateString()
    const dailyInteractions = petData.interactions?.[today] || {}
    
    // 1. Verifica se o usuário já fez alguma coisa hoje
    if (dailyInteractions[user.uid]) {
      alert(`Você já fez sua parte hoje! Espere o seu Amor ${dailyInteractions[user.uid] === 'feed' ? 'dar carinho' : 'alimentar'} o bixinho. ❤️`)
      return
    }

    // 2. Verifica se a ação que ele quer fazer já foi feita por alguém
    const alreadyDone = Object.values(dailyInteractions).includes(type)
    if (alreadyDone) {
      alert(`O bixinho já recebeu ${type === 'feed' ? 'comida' : 'carinho'} hoje! Você precisa fazer a outra tarefa. ❤️`)
      return
    }

    // 3. Aplica a ação
    const newInteractions = { ...petData.interactions, [today]: { ...dailyInteractions, [user.uid]: type } }
    const updates = { 
      interactions: newInteractions,
      exp: petData.exp + 10
    }

    if (type === 'feed') updates.hunger = Math.min(petData.hunger + 30, 100)
    else {
      updates.love = Math.min(petData.love + 30, 100)
      setShowHearts(true)
      setTimeout(() => setShowHearts(false), 2000)
    }

    // Level up
    if (updates.exp >= 100) {
      updates.level = petData.level + 1
      updates.exp = 0
    }

    // 4. Verifica se a missão dupla foi completa hoje
    const todayInteractions = newInteractions[today]
    const uids = Object.keys(todayInteractions)
    const actions = Object.values(todayInteractions)
    
    if (uids.length === 2 && actions.includes('feed') && actions.includes('love')) {
      updates.streak = petData.streak + 1
      updates.lastMissionDate = today
      // Notificação de Streak!
      const notifRef = doc(db, 'couples', profile.coupleId, 'notifications', 'latest')
      await setDoc(notifRef, {
        from: 'system',
        message: `🔥 INCRÍVEL! Missão completa! Streak de ${updates.streak} dias!`,
        timestamp: Date.now(),
        type: 'streak'
      })
    }

    const finalPet = { ...petData, ...updates }
    await updatePet(finalPet)

    // Notificação de ação normal
    const notifRef = doc(db, 'couples', profile.coupleId, 'notifications', 'latest')
    await setDoc(notifRef, {
      from: user.uid,
      message: `${profile.displayName || 'Seu Amor'} acabou de ${type === 'feed' ? 'alimentar' : 'dar carinho'} o bixinho! Agora é sua vez. 🐾`,
      timestamp: Date.now(),
      type: 'pet'
    })
  }

  if (loading || !petData || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl animate-bounce mx-auto">
            <span className="text-white font-black text-xl">🐾</span>
          </div>
          <p className="text-white/50 text-xs font-bold uppercase tracking-[0.3em] animate-pulse">Acordando o bixinho...</p>
        </div>
      </div>
    )
  }

  const today = new Date().toDateString()
  const dailyInteractions = petData.interactions?.[today] || {}
  
  const userAction = dailyInteractions[user.uid]
  const partnerId = profile?.coupleId ? Object.keys(dailyInteractions).find(id => id !== user.uid) : null
  const partnerAction = partnerId ? dailyInteractions[partnerId] : null

  const missionComplete = Object.values(dailyInteractions).includes('feed') && Object.values(dailyInteractions).includes('love')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      <NavBar />
      
      <main className="max-w-2xl mx-auto px-4 pt-10">
        {/* Status Topo */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8 bg-white dark:bg-white/5 p-4 rounded-3xl shadow-sm border border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-xl sm:text-2xl">🔥</div>
            <div>
              <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-orange-500">Sequência</p>
              <p className="text-lg sm:text-xl font-bold dark:text-white">{petData.streak} Dias</p>
            </div>
          </div>
          <div className="text-right flex-1 sm:flex-none">
            <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-indigo-500">Nível {petData.level}</p>
            <div className="w-full sm:w-32 h-2 bg-slate-100 dark:bg-white/10 rounded-full mt-1 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${petData.exp}%` }}
                className="h-full bg-indigo-500" 
              />
            </div>
          </div>
        </div>

        {/* O PET VIVO COM 10 ANIMAÇÕES */}
        <div className="relative flex flex-col items-center py-10">
          <AnimatePresence>
            {showHearts && (
              <motion.div className="absolute top-0 flex gap-4 z-20">
                {[1,2,3,4,5].map(i => (
                  <motion.span 
                    key={i} 
                    initial={{ y: 0, x: 0, opacity: 1, scale: 0.5 }} 
                    animate={{ 
                      y: -200, 
                      x: (i - 3) * 30, 
                      opacity: 0, 
                      scale: 1.5,
                      rotate: i % 2 === 0 ? 45 : -45 
                    }} 
                    transition={{ duration: 2, delay: i * 0.1 }} 
                    className="text-4xl"
                  >
                    ❤️
                  </motion.span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            key={petData.type + petData.level}
            animate={{ 
              scaleX: [1, 1.03, 1],
              scaleY: [1, 0.97, 1],
              y: petData.hunger < 30 ? [0, 2, 0, 2, 0] : [0, -15, 0],
              rotate: petData.hunger < 20 ? [-3, 3, -3, 3, 0] : [0, -1, 1, 0],
              filter: showHearts ? 'brightness(1.1) drop-shadow(0 0 15px rgba(255,255,255,0.4))' : 'brightness(1)'
            }}
            whileTap={{ scale: 0.9, rotate: -5, y: 10 }} 
            transition={{ 
              repeat: Infinity, 
              duration: petData.hunger < 30 ? 0.2 : 4,
              ease: "easeInOut"
            }}
            className="relative z-10 cursor-pointer select-none"
          >
            <div className="relative">
              <span className="text-[120px] sm:text-[180px] md:text-[220px] filter drop-shadow-2xl select-none">
                {PET_TYPES[petData.type || 'cat']?.emoji}
              </span>
              
              {/* Overlay de sono se estiver de madrugada */}
              {(new Date().getHours() < 6 || new Date().getHours() > 22) && (
                <div className="absolute -top-4 -right-4 text-3xl animate-bounce">zzz...</div>
              )}
            </div>

            {/* Balão de Fome Premium */}
            {petData.hunger < 40 && (
              <motion.div
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute top-5 -right-2 bg-white/90 backdrop-blur-md p-2 rounded-xl shadow-xl border border-white/20"
              >
                <span className="text-xl sm:text-2xl">🍲</span>
              </motion.div>
            )}
          </motion.div>

          {/* Sombra 3D Adaptativa */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.15, 0.05, 0.15],
              width: [140, 180, 140]
            }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="h-6 bg-black/30 blur-xl rounded-[100%] mt-[-30px] sm:mt-[-40px]"
          ></motion.div>
        </div>

        {/* Nome e Troca */}
        <div className="text-center mb-10">
          <input 
            type="text"
            value={petData.name}
            onChange={e => updatePet({ name: e.target.value })}
            className="bg-transparent text-3xl sm:text-4xl font-black text-center text-slate-900 dark:text-white focus:outline-none mb-2 w-full max-w-xs"
          />
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-6">
            {Object.entries(PET_TYPES).map(([id, info]) => (
              <button 
                key={id}
                onClick={() => updatePet({ ...petData, type: id })}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden flex items-center justify-center transition-all text-2xl ${petData.type === id ? 'bg-white shadow-xl scale-110 sm:scale-125 ring-4 ring-indigo-500' : 'bg-slate-200 dark:bg-white/5 opacity-40 grayscale hover:grayscale-0 hover:opacity-100'}`}
              >
                {info.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Ações de Cuidado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="soft-card p-5 sm:p-6 flex flex-col items-center gap-4">
             <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div animate={{ width: `${petData.hunger}%` }} className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
             </div>
             <button 
              onClick={() => handleAction('feed')}
              disabled={userAction !== undefined || partnerAction === 'feed'}
              className="w-full py-4 rounded-2xl bg-amber-500 text-white font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all hover:brightness-110 disabled:opacity-50 disabled:grayscale"
             >
               Alimentar 🐟
             </button>
              <p className="text-[10px] font-bold text-slate-400 text-center flex items-center gap-2">
               {userAction === 'feed' ? (
                 <><span className="text-emerald-500">✅</span> Você alimentou</>
               ) : partnerAction === 'feed' ? (
                 <><span className="text-indigo-500">👤</span> O Amor alimentou</>
               ) : (
                 <><span className="text-amber-500 animate-pulse">⏳</span> Pendente</>
               )}
             </p>
          </div>

          <div className="soft-card p-5 sm:p-6 flex flex-col items-center gap-4">
             <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div animate={{ width: `${petData.love}%` }} className="h-full bg-pink-50 shadow-[0_0_10px_rgba(236,72,153,0.5)]" />
             </div>
             <button 
              onClick={() => handleAction('love')}
              disabled={userAction === 'feed' || partnerAction === 'love'}
              className="w-full py-4 rounded-2xl bg-pink-500 text-white font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-lg shadow-pink-500/20 active:scale-95 transition-all hover:brightness-110 disabled:opacity-50 disabled:grayscale"
             >
               Dar Carinho 👋
             </button>
             <p className="text-[10px] font-bold text-slate-400 text-center flex items-center gap-2">
               {userAction === 'love' ? (
                 <><span className="text-emerald-500">✅</span> Você deu carinho</>
               ) : partnerAction === 'love' ? (
                 <><span className="text-indigo-500">👤</span> O Amor deu carinho</>
               ) : (
                 <><span className="text-pink-500 animate-pulse">⏳</span> Pendente</>
               )}
             </p>
          </div>
        </div>

        {/* Alerta de Missão */}
        <div className={`mt-6 p-4 rounded-2xl border text-center transition-colors ${missionComplete ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-slate-100 dark:bg-white/5 border-transparent text-slate-500'}`}>
           <p className="text-xs font-bold uppercase tracking-widest">
             {missionComplete ? '✨ Missão Diária Completa! Streak Mantido!' : 'Um alimenta, o outro acaricia! Façam isso antes da meia-noite.'}
           </p>
        </div>
      </main>
    </div>
  )
}

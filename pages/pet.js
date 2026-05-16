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
  bear: { emoji: '🐻', color: 'from-amber-600 to-orange-800', name: 'Ursinho' }
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
        const pet = { 
          type: 'cat', 
          name: 'Bixinho', 
          level: 1, 
          exp: 0, 
          hunger: 100, 
          love: 100, 
          streak: 0,
          lastAction: Date.now(),
          interactions: {},
          ...(data.pet || {})
        }

        // Lógica de Streak (Foguinho)
        const now = Date.now()
        const oneDay = 24 * 60 * 60 * 1000
        const timeSinceLast = now - (pet.lastAction || now)

        if (timeSinceLast > oneDay) {
          pet.streak = 0
          pet.hunger = Math.max(0, pet.hunger - 20)
        }

        setPetData(pet)
      }
    })
    return () => unsub()
  }, [profile?.coupleId])

  const updatePet = async (updates) => {
    if (!profile?.coupleId || actionLoading) return
    setActionLoading(true)
    const newPet = { ...petData, ...updates, lastAction: Date.now() }
    
    // Sistema de Exp
    if (updates.hunger || updates.love) {
      newPet.exp += 10
      if (newPet.exp >= 100) {
        newPet.level += 1
        newPet.exp = 0
      }
    }

    const coupleRef = doc(db, 'couples', profile.coupleId)
    await setDoc(coupleRef, { pet: newPet }, { merge: true })
    setActionLoading(false)
  }

  const handleAction = async (type) => {
    const today = new Date().toDateString()
    const userInteractions = petData.interactions?.[user.uid] || {}
    
    if (userInteractions.lastDate === today && userInteractions[type]) {
      alert(`Você já deu ${type === 'feed' ? 'comida' : 'carinho'} hoje! Deixe o Amor fazer a parte dele(a) ❤️`)
      return
    }

    const updates = {
      interactions: {
        ...petData.interactions,
        [user.uid]: { ...userInteractions, [type]: true, lastDate: today }
      }
    }

    if (type === 'feed') {
      updates.hunger = Math.min(petData.hunger + 20, 100)
      updates.streak = petData.streak + 1
    } else {
      updates.love = Math.min(petData.love + 20, 100)
      setShowHearts(true)
      setTimeout(() => setShowHearts(false), 2000)
    }

    await updatePet(updates)
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

  const interactions = petData.interactions || {}
  const partnerId = profile?.coupleId ? Object.keys(interactions).find(id => id !== user.uid) : null
  const partnerInteractions = partnerId ? interactions[partnerId] : null
  const today = new Date().toDateString()
  
  const userToday = interactions[user.uid] || {}
  const partnerToday = partnerInteractions || {}

  const bothFed = (userToday.feed && userToday.lastDate === today) && 
                  (partnerToday.feed && partnerToday.lastDate === today)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      <NavBar />
      
      <main className="max-w-xl mx-auto px-4 pt-10">
        {/* Status Topo */}
        <div className="flex justify-between items-center mb-8 bg-white dark:bg-white/5 p-4 rounded-3xl shadow-sm border border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-2xl">🔥</div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Sequência</p>
              <p className="text-xl font-bold dark:text-white">{petData.streak} Dias</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Nível {petData.level}</p>
            <div className="w-32 h-2 bg-slate-100 dark:bg-white/10 rounded-full mt-1 overflow-hidden">
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
              // 1. Respiração + 2. Levitação
              scale: [1, 1.05, 1],
              y: petData.hunger < 30 
                ? [0, 3, 0, 3, 0] // 3. Tremor de Fome
                : [0, -15, 0],    // 4. Flutuação Mágica
              
              // 5. Inclinação de Curiosidade
              rotate: petData.love > 80 
                ? [0, -5, 5, 0] 
                : petData.hunger < 20 ? [-2, 2, -2, 2, 0] : 0,
              
              // 6. Efeito de "Pulo" em ações
              filter: showHearts ? 'brightness(1.2)' : 'brightness(1)'
            }}
            whileTap={{ scale: 0.8, rotate: 15 }} // 7. Reação ao toque
            transition={{ 
              repeat: Infinity, 
              duration: petData.hunger < 30 ? 0.3 : 3,
              ease: "easeInOut"
            }}
            className="relative z-10 cursor-pointer select-none"
          >
            <span className="text-[150px] sm:text-[190px] block drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
              {PET_TYPES[petData.type || 'cat']?.emoji || '🐱'}
            </span>

            {/* 8. Balão de Pensamento Dinâmico */}
            {petData.hunger < 40 && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute -top-8 -right-8 bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-xl border border-slate-100 dark:border-white/10"
              >
                <span className="text-2xl">🍲</span>
              </motion.div>
            )}
          </motion.div>

          {/* 9. Sombra Dinâmica + 10. Pulsar de Felicidade */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
              width: [120, 150, 120]
            }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="h-6 bg-black/20 dark:bg-white/10 blur-xl rounded-full mt-[-25px]"
          ></motion.div>
        </div>

        {/* Nome e Troca */}
        <div className="text-center mb-10">
          <input 
            type="text"
            value={petData.name}
            onChange={e => updatePet({ name: e.target.value })}
            className="bg-transparent text-3xl font-black text-center text-slate-900 dark:text-white focus:outline-none"
          />
          <div className="flex justify-center gap-2 mt-4">
            {Object.entries(PET_TYPES).map(([id, info]) => (
              <button 
                key={id}
                onClick={() => updatePet({ type: id })}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${petData.type === id ? 'bg-white shadow-md scale-110 ring-2 ring-indigo-500' : 'bg-slate-200 dark:bg-white/5 opacity-50'}`}
              >
                {info.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Ações de Cuidado */}
        <div className="grid grid-cols-2 gap-4">
          <div className="soft-card p-6 flex flex-col items-center gap-4">
             <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div animate={{ width: `${petData.hunger}%` }} className="h-full bg-amber-500" />
             </div>
             <button 
              onClick={() => handleAction('feed')}
              className="w-full py-4 rounded-2xl bg-amber-500 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-transform"
             >
               Alimentar 🐟
             </button>
             <p className="text-[10px] font-bold text-slate-400">
               {userToday.feed && userToday.lastDate === today ? '✅ Você já alimentou' : '⏳ Sua vez'}
             </p>
          </div>

          <div className="soft-card p-6 flex flex-col items-center gap-4">
             <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div animate={{ width: `${petData.love}%` }} className="h-full bg-pink-500" />
             </div>
             <button 
              onClick={() => handleAction('love')}
              className="w-full py-4 rounded-2xl bg-pink-500 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-pink-500/20 active:scale-95 transition-transform"
             >
               Carinho 👋
             </button>
             <p className="text-[10px] font-bold text-slate-400">
               {userToday.love && userToday.lastDate === today ? '✅ Você já deu carinho' : '⏳ Sua vez'}
             </p>
          </div>
        </div>

        {/* Alerta de Missão */}
        <div className={`mt-6 p-4 rounded-2xl border text-center transition-colors ${bothFed ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-slate-100 dark:bg-white/5 border-transparent text-slate-500'}`}>
           <p className="text-xs font-bold uppercase tracking-widest">
             {bothFed ? '✨ Missão Diária Completa! +1 Foguinho' : 'Falta um de vocês cuidar para ganhar o foguinho!'}
           </p>
        </div>
      </main>
    </div>
  )
}

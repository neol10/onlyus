  // Efeito Visual de Chama Animada
  const FlameEffect = ({ streak, isLosing }) => {
    if (streak === 0 && !isLosing) return null
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <AnimatePresence>
          {!isLosing ? (
            // Fogo Ativo
            [...Array(Math.min(streak + 3, 15))].map((_, i) => (
              <motion.div
                key={`flame-${i}`}
                initial={{ opacity: 0, y: 0, scale: 1 }}
                animate={{ 
                  opacity: [0, 0.7, 0], 
                  y: -100 - (Math.random() * 50), 
                  x: (Math.random() - 0.5) * 60,
                  scale: [1, 1.5, 0.5]
                }}
                transition={{ 
                  duration: 1 + Math.random(), 
                  repeat: Infinity, 
                  delay: i * 0.1 
                }}
                className={`absolute w-4 h-4 rounded-full blur-md ${streak > 10 ? 'bg-cyan-400' : 'bg-orange-500'}`}
              />
            ))
          ) : (
            // Fumaça de Perda
            [...Array(10)].map((_, i) => (
              <motion.div
                key={`smoke-${i}`}
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, 0.3, 0], y: -120, x: (Math.random() - 0.5) * 100, scale: [1, 3] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                className="absolute w-6 h-6 bg-slate-400 rounded-full blur-lg"
              />
            ))
          )}
        </AnimatePresence>
      </div>
    )
  }

  const { user, profile, loading } = useAuth()
  const { showToast } = useToast()
  const [petData, setPetData] = useState(null)
  const [showHearts, setShowHearts] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [isUrgent, setIsUrgent] = useState(false)

  useEffect(() => {
    if (!profile?.coupleId) return

    const coupleRef = doc(db, 'couples', profile.coupleId)
    const unsub = onSnapshot(coupleRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        const now = new Date()
        const todayKey = now.toDateString()
        
        const pet = { 
          type: 'cat', name: 'Bixinho', level: 1, exp: 0, hunger: 100, love: 100, streak: 0,
          lastMissionDate: '', interactions: {}, hue: 0,
          ...(data.pet || {})
        }

        const yesterday = new Date(now)
        yesterday.setDate(now.getDate() - 1)
        const yesterdayKey = yesterday.toDateString()

        if (pet.lastMissionDate !== todayKey && pet.lastMissionDate !== yesterdayKey && pet.lastMissionDate !== '') {
          if (pet.streak > 0) {
            showToast('A chama apagou... 😢 Cuide mais do bixinho!', 'error')
            pet.streak = 0
            pet.hunger = 20
            pet.love = 20
          }
        }

        // Verificar urgência (após as 20h se missão não completa)
        const isMissionDone = pet.interactions?.[todayKey] && 
                             Object.keys(pet.interactions[todayKey]).length === 2
        if (now.getHours() >= 20 && !isMissionDone) {
          setIsUrgent(true)
          showToast('URGENTE: Nossa chama vai apagar à meia-noite! 🔥🆘', 'error')
        } else {
          setIsUrgent(false)
        }

        setPetData(pet)
      }
    })
    return () => unsub()
  }, [profile?.coupleId])

  const updatePet = async (newPet) => {
    if (!profile?.coupleId || actionLoading) return
    setActionLoading(true)
    await setDoc(doc(db, 'couples', profile.coupleId), { pet: newPet }, { merge: true })
    setActionLoading(false)
  }

  const handleAction = async (type) => {
    const today = new Date().toDateString()
    const dailyInteractions = petData.interactions?.[today] || {}
    
    if (dailyInteractions[user.uid]) {
      showToast('Você já fez sua parte hoje! ❤️', 'error')
      return
    }

    const alreadyDone = Object.values(dailyInteractions).includes(type)
    if (alreadyDone) {
      showToast(`O bixinho já recebeu ${type === 'feed' ? 'comida' : 'carinho'}!`, 'error')
      return
    }

    const newInteractions = { ...petData.interactions, [today]: { ...dailyInteractions, [user.uid]: type } }
    const updates = { interactions: newInteractions, exp: petData.exp + 15 }

    if (type === 'feed') updates.hunger = Math.min(petData.hunger + 40, 100)
    else {
      updates.love = Math.min(petData.love + 40, 100)
      setShowHearts(true)
      setTimeout(() => setShowHearts(false), 2000)
    }

    if (updates.exp >= 100) {
      updates.level = petData.level + 1
      updates.exp = 0
      showToast(`LEVEL UP! ${petData.name} subiu para o nível ${updates.level}! ✨`)
    }

    const todayInteractions = newInteractions[today]
    if (Object.keys(todayInteractions).length === 2) {
      updates.streak = petData.streak + 1
      updates.lastMissionDate = today
      showToast('SEQUÊNCIA MANTIDA! 🔥 O fogo subiu!', 'success')
      
      const notifRef = doc(db, 'couples', profile.coupleId, 'notifications', 'latest')
      await setDoc(notifRef, {
        from: 'system',
        message: `🔥 INCRÍVEL! Streak de ${updates.streak} dias atingido!`,
        timestamp: Date.now(),
        type: 'streak'
      })
    }

    await updatePet({ ...petData, ...updates })
  }

  if (loading || !petData || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center animate-pulse">
          <div className="w-16 h-16 bg-indigo-500 rounded-3xl mx-auto mb-4" />
          <p className="text-white/50 text-[10px] font-black uppercase tracking-widest">Sincronizando bixinho...</p>
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 overflow-hidden">
      <NavBar />
      
      <main className="max-w-2xl mx-auto px-4 pt-10 relative">
        {/* Fundo de Alerta se for Urgente */}
        <AnimatePresence>
          {isUrgent && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 0.1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-red-600 pointer-events-none z-0"
              style={{ animation: 'pulse 1s infinite' }}
            />
          )}
        </AnimatePresence>

        <div className="flex flex-wrap justify-between items-center gap-4 mb-8 bg-white dark:bg-white/5 p-5 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-white/10 relative z-10">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg ${petData.streak > 0 ? 'bg-orange-500 text-white shadow-orange-500/20' : 'bg-slate-200 dark:bg-white/5 text-slate-400'}`}>
              {petData.streak > 0 ? '🔥' : '❄️'}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Sequência Viva</p>
              <p className="text-2xl font-black dark:text-white leading-none">{petData.streak} Dias</p>
            </div>
          </div>
          
          <div className="text-right">
             <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Nível {petData.level}</p>
             <div className="w-32 h-3 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden shadow-inner">
                <motion.div animate={{ width: `${petData.exp}%` }} className="h-full bg-gradient-to-r from-indigo-500 to-purple-600" />
             </div>
          </div>
        </div>

        <div className="relative flex flex-col items-center py-16">
          <FlameEffect streak={petData.streak} isLosing={isUrgent && !missionComplete} />
          
          <AnimatePresence>
            {showHearts && (
              <motion.div className="absolute top-0 flex gap-4 z-20">
                {[1,2,3,4,5].map(i => (
                  <motion.span key={i} initial={{ y: 0, opacity: 1 }} animate={{ y: -250, opacity: 0, x: (i-3)*40 }} transition={{ duration: 2 }} className="text-5xl">❤️</motion.span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            animate={{ 
              y: isUrgent ? [0, -10, 0] : [0, -20, 0],
              scaleX: [1, 1.05, 1],
              scaleY: [1, 0.95, 1],
              rotate: isUrgent ? [-5, 5, -5] : [0, 1, -1, 0]
            }}
            transition={{ repeat: Infinity, duration: isUrgent ? 0.3 : 4 }}
            className="relative z-10 cursor-pointer"
          >
            <span 
              className="text-[150px] sm:text-[200px] select-none block"
              style={{ filter: `hue-rotate(${petData.hue || 0}deg) drop-shadow(0 0 50px rgba(255,255,255,0.1))` }}
            >
              {petData.hunger < 20 ? '💀' : PET_TYPES[petData.type]?.emoji}
            </span>
          </motion.div>

          <motion.div 
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.1, 0.2] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="h-8 bg-black/40 blur-2xl rounded-[100%] w-40 mt-[-40px]"
          />
        </div>

        {isUrgent && !missionComplete && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-red-500 text-white p-4 rounded-2xl mb-8 text-center font-black uppercase tracking-tighter text-sm shadow-2xl shadow-red-500/40 animate-pulse"
          >
            🚨 SOS! NOSSA CHAMA ESTÁ APAGANDO! 🚨<br/>
            <span className="text-[10px] opacity-80">Completem a missão antes da meia-noite!</span>
          </motion.div>
        )}

        <div className="text-center mb-12">
          <input 
            type="text" value={petData.name}
            onChange={e => updatePet({ ...petData, name: e.target.value })}
            className="bg-transparent text-4xl font-black text-center text-slate-900 dark:text-white focus:outline-none w-full"
          />
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {Object.entries(PET_TYPES).map(([id, info]) => (
              <button 
                key={id} onClick={() => updatePet({ ...petData, type: id })}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all ${petData.type === id ? 'bg-white shadow-xl scale-125 ring-4 ring-indigo-500' : 'bg-slate-200 dark:bg-white/5 opacity-40 grayscale hover:grayscale-0'}`}
              >
                {info.emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="soft-card p-6 flex flex-col items-center gap-5">
             <div className="w-full flex justify-between text-[10px] font-black uppercase">
                <span className="text-amber-600">Energia</span>
                <span className="text-slate-400">{petData.hunger}%</span>
             </div>
             <div className="w-full h-3 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden shadow-inner">
                <motion.div animate={{ width: `${petData.hunger}%` }} className="h-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
             </div>
             <button 
              onClick={() => handleAction('feed')}
              disabled={userAction !== undefined || partnerAction === 'feed'}
              className="w-full py-4 rounded-3xl bg-amber-500 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-amber-500/20 active:scale-95 disabled:opacity-50"
             >
               Alimentar 🐟
             </button>
          </div>

          <div className="soft-card p-6 flex flex-col items-center gap-5">
             <div className="w-full flex justify-between text-[10px] font-black uppercase">
                <span className="text-pink-600">Amor</span>
                <span className="text-slate-400">{petData.love}%</span>
             </div>
             <div className="w-full h-3 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden shadow-inner">
                <motion.div animate={{ width: `${petData.love}%` }} className="h-full bg-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.5)]" />
             </div>
             <button 
              onClick={() => handleAction('love')}
              disabled={userAction !== undefined || partnerAction === 'love'}
              className="w-full py-4 rounded-3xl bg-pink-500 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-pink-500/20 active:scale-95 disabled:opacity-50"
             >
               Dar Carinho 👋
             </button>
          </div>
        </div>
      </main>
    </div>
  )
}

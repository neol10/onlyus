import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import NavBar from '../components/NavBar'
import { useAuth } from '../src/context/AuthContext'
import { db } from '../src/firebase/firebaseClient'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'

export default function PetPage() {
  const { user, profile, loading } = useAuth()
  const [petData, setPetData] = useState({ mood: 100, name: 'Bixinho', level: 1 })
  const [showHearts, setShowHearts] = useState(false)
  const [petting, setPetting] = useState(false)

  useEffect(() => {
    if (!profile?.coupleId) return

    const coupleRef = doc(db, 'couples', profile.coupleId)
    const unsub = onSnapshot(coupleRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        if (data.pet) setPetData(data.pet)
      }
    })
    return () => unsub()
  }, [profile?.coupleId])

  const updatePet = async (updates) => {
    if (!profile?.coupleId) return
    const newPet = { ...petData, ...updates }
    setPetData(newPet)
    const coupleRef = doc(db, 'couples', profile.coupleId)
    await setDoc(coupleRef, { pet: newPet }, { merge: true })
  }

  const handlePetting = () => {
    setPetting(true)
    setShowHearts(true)
    updatePet({ mood: Math.min(petData.mood + 5, 100) })
    setTimeout(() => {
      setPetting(false)
      setShowHearts(false)
    }, 2000)
  }

  const handleFeed = () => {
    updatePet({ mood: Math.min(petData.mood + 15, 100), level: petData.level + 0.1 })
  }

  if (loading) return null

  if (!profile?.coupleId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="soft-card p-8 text-center max-w-sm">
          <p className="text-slate-500 mb-4">Você precisa estar em um casal para adotar um pet!</p>
        </div>
      </div>
    )
  }

  const getMoodEmoji = () => {
    if (petData.mood > 80) return '🥰'
    if (petData.mood > 50) return '🙂'
    if (petData.mood > 20) return '😴'
    return '😿'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-slate-950 dark:to-slate-900 pb-20">
      <NavBar />
      
      <main className="max-w-4xl mx-auto px-4 pt-8">
        <header className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-black text-slate-900 dark:text-white"
          >
            Nosso Pet {getMoodEmoji()}
          </motion.h1>
          <p className="text-slate-500 mt-2">Cuidem dele juntos!</p>
        </header>

        <div className="relative flex flex-col items-center">
          {/* Corações Animados */}
          <AnimatePresence>
            {showHearts && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-0 flex gap-4"
              >
                {[1, 2, 3].map(i => (
                  <motion.span
                    key={i}
                    initial={{ y: 0, opacity: 1 }}
                    animate={{ y: -100, opacity: 0 }}
                    transition={{ duration: 1.5, delay: i * 0.2 }}
                    className="text-4xl"
                  >
                    ❤️
                  </motion.span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* O PET */}
          <motion.div
            animate={{ 
              y: petting ? [0, -10, 0] : [0, -15, 0],
              scale: petting ? [1, 1.05, 1] : 1
            }}
            transition={{ 
              repeat: Infinity, 
              duration: petting ? 0.5 : 3,
              ease: "easeInOut" 
            }}
            onClick={handlePetting}
            className="cursor-pointer relative z-10"
          >
            <div className="relative">
              <img 
                src="/pet.png" 
                alt="Nosso Pet" 
                className="w-64 h-64 sm:w-80 sm:h-80 object-contain drop-shadow-[0_35px_35px_rgba(0,0,0,0.2)]"
              />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-8 bg-black/10 blur-xl rounded-full"></div>
            </div>
          </motion.div>

          {/* Status */}
          <div className="mt-12 w-full max-w-md bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <input 
                  type="text"
                  value={petData.name}
                  onChange={e => updatePet({ name: e.target.value })}
                  className="bg-transparent text-xl font-bold text-slate-900 dark:text-white border-b border-transparent hover:border-slate-300 focus:outline-none focus:border-pink-500 transition-colors"
                />
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Nível {Math.floor(petData.level)}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Felicidade</span>
                <p className="text-2xl font-black text-pink-500">{petData.mood}%</p>
              </div>
            </div>

            <div className="h-3 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden mb-8">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${petData.mood}%` }}
                className="h-full bg-gradient-to-r from-pink-500 to-violet-600 shadow-[0_0_15px_rgba(236,72,153,0.5)]"
              ></motion.div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handlePetting}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-pink-50 dark:bg-pink-500/10 hover:bg-pink-100 transition-colors group"
              >
                <span className="text-2xl group-hover:scale-125 transition-transform">👋</span>
                <span className="text-xs font-bold text-pink-700 dark:text-pink-400 uppercase tracking-wider">Carinho</span>
              </button>
              <button 
                onClick={handleFeed}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 transition-colors group"
              >
                <span className="text-2xl group-hover:scale-125 transition-transform">🐟</span>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Alimentar</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

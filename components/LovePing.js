import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../src/firebase/firebaseClient'
import { useAuth } from '../src/context/AuthContext'

export default function LovePing() {
  const { user, profile } = useAuth()
  const [hearts, setHearts] = useState([])
  const [isPinging, setIsPinging] = useState(false)
  const [lastPingRecv, setLastPingRecv] = useState(0)

  useEffect(() => {
    if (!user || !db || !profile?.coupleId) return
    const pingRef = doc(db, 'couples', profile.coupleId)
    const unsub = onSnapshot(pingRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().pingAt) {
        const pingTime = docSnap.data().pingAt
        if (pingTime !== lastPingRecv && (Date.now() - pingTime < 60000)) {
          if (lastPingRecv !== 0) {
            triggerHearts()
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100, 50, 100])
          }
        }
        setLastPingRecv(pingTime)
      }
    })
    return () => unsub()
  }, [user, profile?.coupleId, lastPingRecv])

  const triggerHearts = () => {
    const newHearts = Array.from({ length: 20 }).map((_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      delay: Math.random() * 0.4,
      size: Math.random() * 24 + 16,
      rotate: Math.random() * 360
    }))
    setHearts(h => [...h, ...newHearts])
    setTimeout(() => setHearts([]), 3500)
  }

  const sendPing = async () => {
    if (!user || !db || isPinging || !profile?.coupleId) return
    setIsPinging(true)
    triggerHearts()
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50)
    try {
      await setDoc(doc(db, 'couples', profile.coupleId), { pingAt: Date.now() }, { merge: true })
    } catch (err) {
      console.error(err)
    }
    setTimeout(() => setIsPinging(false), 1500)
  }

  return (
    <>
      <button 
        onClick={sendPing}
        disabled={isPinging}
        className="fixed bottom-[80px] sm:bottom-8 right-6 sm:right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 shadow-xl shadow-rose-500/30 transition-transform active:scale-90 hover:scale-110 disabled:opacity-80"
      >
        <svg className="h-7 w-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </button>

      <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
        <AnimatePresence>
          {hearts.map(h => (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, y: '110vh', x: `${h.x}vw`, scale: 0.5, rotate: 0 }}
              animate={{ opacity: [0, 1, 1, 0], y: '-10vh', scale: [0.5, 1.2, 1, 0.8], rotate: h.rotate }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.5, delay: h.delay, ease: "easeOut" }}
              className="absolute bottom-0 text-rose-500 drop-shadow-md"
              style={{ fontSize: h.size }}
            >
              ❤️
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  )
}

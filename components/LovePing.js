import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../src/firebase/firebaseClient'
import { useAuth } from '../src/context/AuthContext'

export default function LovePing() {
  const { user, profile } = useAuth()
  const [particles, setParticles] = useState([])
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [lastPingRecv, setLastPingRecv] = useState(null)
  
  // States do Love Shake
  const [showShakeSuccess, setShowShakeSuccess] = useState(false)
  const lastShakeTime = useRef(0)
  const [lastLocalShake, setLastLocalShake] = useState(0)

  // Listeners de tempo real para Pings e Shakes
  useEffect(() => {
    if (!user || !db || !profile?.coupleId) return

    const coupleRef = doc(db, 'couples', profile.coupleId)
    const unsub = onSnapshot(coupleRef, (docSnap) => {
      if (!docSnap.exists()) return
      const data = docSnap.data()

      // 1. Escuta Pings Dinâmicos
      if (data.latestPing) {
        const ping = data.latestPing
        if (ping.sender !== user.uid && (!lastPingRecv || ping.timestamp > lastPingRecv)) {
          triggerIncomingPing(ping.type)
          setLastPingRecv(ping.timestamp)
        }
      }

      // 2. Escuta Shakes Físicos simultâneos
      if (data.shakes) {
        const shakes = data.shakes
        const partnerId = data.partnerA === user.uid ? data.partnerB : data.partnerA
        const myLastShake = shakes[user.uid] || 0
        const partnerLastShake = shakes[partnerId] || 0

        // Se ambos sacudiram dentro de um intervalo de 8 segundos nos últimos 30 segundos
        const diff = Math.abs(myLastShake - partnerLastShake)
        const now = Date.now()
        if (
          myLastShake > 0 &&
          partnerLastShake > 0 &&
          diff < 8000 &&
          (now - myLastShake < 25000) &&
          (now - partnerLastShake < 25000)
        ) {
          triggerShakeSuccess()
        }
      }
    })

    return () => unsub()
  }, [user, profile?.coupleId, lastPingRecv])

  // Sensor físico de Shake
  useEffect(() => {
    if (typeof window === 'undefined') return

    let lastX = null, lastY = null, lastZ = null
    const threshold = 22 // Sensibilidade da sacudida

    const handleMotionEvent = (event) => {
      const acc = event.accelerationIncludingGravity
      if (!acc) return

      const { x, y, z } = acc
      if (lastX !== null) {
        const deltaX = Math.abs(x - lastX)
        const deltaY = Math.abs(y - lastY)
        const deltaZ = Math.abs(z - lastZ)

        // Se a força combinada for maior que o threshold
        if (deltaX + deltaY + deltaZ > threshold) {
          const now = Date.now()
          // Cooldown de 5 segundos
          if (now - lastShakeTime.current > 5000) {
            lastShakeTime.current = now
            setLastLocalShake(now)
            sendLocalShake(now)
          }
        }
      }

      lastX = x
      lastY = y
      lastZ = z
    }

    // Solicita permissão para sensores no iOS 13+
    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof DeviceMotionEvent.requestPermission === 'function'
    ) {
      // iOS exige toque para solicitar permissão,
      // então o listener é adicionado assim que houver interação do usuário na página.
      const requestIOSPermission = () => {
        DeviceMotionEvent.requestPermission()
          .then((response) => {
            if (response === 'granted') {
              window.addEventListener('devicemotion', handleMotionEvent, true)
            }
          })
          .catch(console.error)
        window.removeEventListener('click', requestIOSPermission)
      }
      window.addEventListener('click', requestIOSPermission)
    } else {
      window.addEventListener('devicemotion', handleMotionEvent, true)
    }

    return () => {
      window.removeEventListener('devicemotion', handleMotionEvent, true)
    }
  }, [profile?.coupleId, user])

  // Envia shake local para o Firestore
  const sendLocalShake = async (timestamp) => {
    if (!user || !db || !profile?.coupleId) return
    const coupleRef = doc(db, 'couples', profile.coupleId)
    try {
      await updateDoc(coupleRef, {
        [`shakes.${user.uid}`]: timestamp
      })
      // Feedback tátil imediato no seu celular
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100])
      }
    } catch (err) {
      console.error('Erro ao salvar shake:', err)
    }
  }

  // Comemoração simultânea bem-sucedida do Love Shake
  const triggerShakeSuccess = () => {
    setShowShakeSuccess(true)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 300])
    }
    // Cria super tempestade de corações e estrelas
    const burst = Array.from({ length: 40 }).map((_, i) => ({
      id: `shake-${Date.now()}-${i}`,
      emoji: Math.random() > 0.5 ? '✨' : '💖',
      x: Math.random() * 100,
      size: Math.random() * 32 + 20,
      delay: Math.random() * 0.6,
      rotate: Math.random() * 360
    }))
    setParticles(p => [...p, ...burst])
    setTimeout(() => {
      setShowShakeSuccess(false)
      setParticles([])
    }, 4500)
  }

  // Recebe e renderiza efeitos táteis/visuais na tela do parceiro
  const triggerIncomingPing = (type) => {
    let emojis = ['❤️']
    let vibrationPattern = [100]

    if (type === 'kiss') {
      emojis = ['💋', '😘', '❤️']
      vibrationPattern = [80, 50, 80]
    } else if (type === 'hug') {
      emojis = ['🤗', '🫶', '💖']
      vibrationPattern = [150, 100, 150]
    } else if (type === 'miss') {
      emojis = ['🥺', '🤍', '😭']
      vibrationPattern = [200]
    } else if (type === 'poke') {
      emojis = ['⚡', '💥', '👀']
      vibrationPattern = [400]
      // Tremor físico da página inteira!
      if (typeof document !== 'undefined') {
        const body = document.body
        body.classList.add('screen-shake')
        setTimeout(() => body.classList.remove('screen-shake'), 550)
      }
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(vibrationPattern)
    }

    const burst = Array.from({ length: 25 }).map((_, i) => ({
      id: `ping-${Date.now()}-${i}`,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      x: Math.random() * 100,
      size: Math.random() * 28 + 16,
      delay: Math.random() * 0.4,
      rotate: Math.random() * 360
    }))
    
    setParticles(p => [...p, ...burst])
    setTimeout(() => setParticles([]), 3500)
  }

  // Envia ping dinâmico
  const sendPing = async (type) => {
    if (!user || !db || !profile?.coupleId) return
    setIsMenuOpen(false)

    // Feedback local imediato
    triggerIncomingPing(type)

    const coupleRef = doc(db, 'couples', profile.coupleId)
    try {
      await updateDoc(coupleRef, {
        latestPing: {
          sender: user.uid,
          timestamp: Date.now(),
          type: type,
          id: Math.random().toString(36).substring(2, 9)
        }
      })
    } catch (err) {
      console.error('Erro ao enviar ping:', err)
    }
  }

  const PING_TYPES = [
    { type: 'heart', label: 'Coração', emoji: '❤️', color: 'from-rose-500 to-pink-500' },
    { type: 'kiss', label: 'Beijinho', emoji: '💋', color: 'from-pink-500 to-rose-600' },
    { type: 'hug', label: 'Abraço', emoji: '🤗', color: 'from-amber-400 to-orange-500' },
    { type: 'miss', label: 'Saudade', emoji: '🥺', color: 'from-indigo-400 to-purple-500' },
    { type: 'poke', label: 'Cutucar', emoji: '⚡', color: 'from-yellow-400 to-amber-500' }
  ]

  return (
    <>
      {/* Botão Flutuante Principal e Menu em Leque */}
      <div className="fixed bottom-[84px] sm:bottom-8 right-6 sm:right-8 z-40 flex flex-col items-center">
        <AnimatePresence>
          {isMenuOpen && (
            <div className="flex flex-col gap-2.5 mb-3 items-center">
              {PING_TYPES.map((pt, idx) => (
                <motion.button
                  key={pt.type}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ delay: (PING_TYPES.length - idx) * 0.05 }}
                  onClick={() => sendPing(pt.type)}
                  className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr ${pt.color} shadow-lg text-lg hover:scale-110 active:scale-90 transition-transform relative group`}
                  title={pt.label}
                >
                  <span className="select-none">{pt.emoji}</span>
                  {/* Tooltip */}
                  <span className="absolute right-14 bg-slate-900/90 backdrop-blur-sm text-[10px] font-black text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-wider">
                    {pt.label}
                  </span>
                </motion.button>
              ))}
              {/* Overlay transparente para fechar ao clicar fora */}
              <div 
                className="fixed inset-0 z-[-1] cursor-default" 
                onClick={() => setIsMenuOpen(false)}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Botão de Coração Principal */}
        <motion.button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          animate={{ scale: isMenuOpen ? 1.05 : 1 }}
          className={`flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all ${
            isMenuOpen 
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 rotate-45' 
              : 'bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-rose-500/30 hover:scale-110 active:scale-95'
          }`}
        >
          {isMenuOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-7 w-7 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          )}
        </motion.button>
      </div>

      {/* Chuva de Partículas na Tela Inteira */}
      <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
        <AnimatePresence>
          {particles.map(p => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: '110vh', x: `${p.x}vw`, scale: 0.5, rotate: 0 }}
              animate={{ opacity: [0, 1, 1, 0], y: '-10vh', scale: [0.5, 1.2, 1, 0.8], rotate: p.rotate }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.6, delay: p.delay, ease: "easeOut" }}
              className="absolute bottom-0 drop-shadow-md select-none"
              style={{ fontSize: p.size }}
            >
              {p.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal / Overlay Especial para Sucesso do Love Shake */}
      <AnimatePresence>
        {showShakeSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 1.2, opacity: 0 }}
              className="bg-white/95 dark:bg-slate-900/95 p-8 rounded-[3rem] shadow-[0_0_50px_rgba(244,63,94,0.4)] border-2 border-rose-500/20 text-center max-w-xs mx-4 relative overflow-hidden"
            >
              {/* Partículas brilhantes internas */}
              <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/10 via-transparent to-indigo-500/10 stellar-sparkle pointer-events-none" />

              <span className="text-6xl mb-4 block animate-bounce select-none">⚡🤝💞</span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">VOCÊS SE CONECTARAM!</h2>
              <p className="text-rose-500 font-bold uppercase tracking-widest text-[10px] mb-4">LOVE SHAKE SUCESSO</p>
              
              <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
                Vocês sacudiram os celulares exatamente no mesmo instante! A conexão de vocês é real. 💖
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

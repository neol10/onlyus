import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../src/firebase/firebaseClient'
import { useAuth } from '../src/context/AuthContext'
import { useToast } from '../src/context/ToastContext'

export default function LoveNotes() {
  const { user, profile } = useAuth()
  const { showToast } = useToast()
  
  const [noteText, setNoteText] = useState('')
  const [loading, setLoading] = useState(true)
  const [todayData, setTodayData] = useState(null)
  const [isScratchDone, setIsScratchDone] = useState(false)
  const canvasRef = useRef(null)
  const isDrawing = useRef(false)

  // Data de hoje em formato YYYY-MM-DD baseada no fuso local do usuário
  const todayStr = new Date().toLocaleDateString('sv').substring(0, 10)

  useEffect(() => {
    if (!user || !db || !profile?.coupleId) return

    const noteRef = doc(db, 'couples', profile.coupleId, 'loveNotes', todayStr)
    const unsub = onSnapshot(noteRef, (docSnap) => {
      setLoading(false)
      if (docSnap.exists()) {
        setTodayData(docSnap.data())
      } else {
        setTodayData(null)
      }
    })

    return () => unsub()
  }, [user, profile?.coupleId, todayStr])

  // Lógica de Canvas para a raspadinha
  useEffect(() => {
    if (!canvasRef.current || !todayData) return

    // Só inicializa o Canvas se ambos já escreveram e a raspadinha não estiver concluída
    const partnerId = todayData.partnerA === user.uid ? todayData.partnerB : todayData.partnerA
    const bothWritten = todayData.notes?.[user.uid] && todayData.notes?.[partnerId]
    if (!bothWritten || isScratchDone) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // Configura tamanho correto para responsividade
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    // Fundo do raspável — Gradiente lindo rosa/violeta metalizado
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    grad.addColorStop(0, '#f43f5e') // rose-500
    grad.addColorStop(0.5, '#ec4899') // pink-500
    grad.addColorStop(1, '#6366f1') // indigo-500
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Detalhes extras no raspável
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    for (let i = 0; i < 20; i++) {
      ctx.beginPath()
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 20 + 5, 0, Math.PI * 2)
      ctx.fill()
    }

    // Texto explicativo
    ctx.fillStyle = '#ffffff'
    ctx.font = '900 13px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('RASPE AQUI COM O DEDO 💖', canvas.width / 2, canvas.height / 2 - 5)
    ctx.font = '600 10px sans-serif'
    ctx.fillText('Para ler o bilhete de hoje', canvas.width / 2, canvas.height / 2 + 12)

  }, [todayData, isScratchDone])

  // Desenha no Canvas para raspar
  const scratch = (clientX, clientY) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top

    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(x, y, 22, 0, Math.PI * 2)
    ctx.fill()

    // Verifica progresso de raspagem
    checkScratchProgress()
  }

  const checkScratchProgress = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imgData.data
    let transparentCount = 0

    // Checa a transparência de pixels (canal alpha)
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparentCount++
    }

    const percent = (transparentCount / (pixels.length / 4)) * 100
    if (percent > 55) {
      setIsScratchDone(true)
      showToast('Revelado! Que fofo... 🥰', 'success')
    }
  }

  const handleMouseDown = (e) => {
    isDrawing.current = true
    scratch(e.clientX, e.clientY)
  }

  const handleMouseMove = (e) => {
    if (!isDrawing.current) return
    scratch(e.clientX, e.clientY)
  }

  const handleMouseUp = () => {
    isDrawing.current = false
  }

  const handleTouchStart = (e) => {
    isDrawing.current = true
    if (e.touches[0]) {
      scratch(e.touches[0].clientX, e.touches[0].clientY)
    }
  }

  const handleTouchMove = (e) => {
    if (!isDrawing.current) return
    if (e.touches[0]) {
      scratch(e.touches[0].clientX, e.touches[0].clientY)
    }
  }

  // Enviar nota do dia
  const handleSubmitNote = async (e) => {
    e.preventDefault()
    if (!noteText.trim() || !profile?.coupleId) return

    const partnerId = profile.partnerId || ''
    const noteRef = doc(db, 'couples', profile.coupleId, 'loveNotes', todayStr)

    try {
      const dataToSave = {
        partnerA: user.uid,
        partnerB: partnerId,
        notes: {
          ...todayData?.notes,
          [user.uid]: noteText.trim()
        },
        timestamp: Date.now()
      }
      await setDoc(noteRef, dataToSave, { merge: true })
      showToast('Bilhete enviado com amor! 💌')
      setNoteText('')
    } catch (err) {
      console.error(err)
      showToast('Erro ao salvar bilhete.', 'error')
    }
  }

  if (loading) {
    return (
      <div className="soft-card p-6 flex justify-center items-center h-40">
        <span className="animate-spin text-indigo-500 text-xl">⏳</span>
      </div>
    )
  }

  const myNote = todayData?.notes?.[user.uid] || ''
  const partnerId = todayData?.partnerA === user.uid ? todayData?.partnerB : todayData?.partnerA
  const partnerNote = todayData?.notes?.[partnerId] || ''
  const partnerNick = profile?.partnerNick || 'Seu Amor'

  return (
    <div className="soft-card p-5 relative overflow-hidden bg-gradient-to-br from-indigo-500/5 via-transparent to-pink-500/5 border border-indigo-500/10">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">💌</span>
        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Cartinha do Dia</h4>
      </div>

      {/* ESTADO 1: Você ainda não escreveu a sua nota */}
      {!myNote && (
        <form onSubmit={handleSubmitNote} className="space-y-3">
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Deixe um recadinho especial para <b>{partnerNick}</b> hoje. Vocês só poderão ler os bilhetes quando ambos tiverem escrito!
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Digite aqui algo carinhoso... 🥰"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value.substring(0, 160))}
              maxLength={160}
              className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs outline-none focus:ring-1 focus:ring-rose-400 focus:border-rose-400"
            />
            <button
              type="submit"
              disabled={!noteText.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl text-xs font-black shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              Enviar 💖
            </button>
          </div>
          <p className="text-[9px] text-slate-400 text-right">{noteText.length}/160 caracteres</p>
        </form>
      )}

      {/* ESTADO 2: Você escreveu, mas seu parceiro ainda não */}
      {myNote && !partnerNote && (
        <div className="text-center py-6 space-y-2">
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <span className="text-xl">⏳</span>
          </div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Seu bilhete foi selado com amor!</p>
          <p className="text-[10px] text-slate-400">
            Aguardando a cartinha do(a) <b>{partnerNick}</b> para revelar o que ele(a) escreveu para você hoje...
          </p>
        </div>
      )}

      {/* ESTADO 3: Ambos escreveram! Exibe a Raspadinha */}
      {myNote && partnerNote && (
        <div className="space-y-4">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center">
            ✨ Vocês dois escreveram hoje! Raspe abaixo para ler:
          </p>

          <div className="relative w-full h-32 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-white/10 overflow-hidden flex items-center justify-center p-4">
            {/* Texto real do parceiro revelado por baixo */}
            <div className="text-center relative z-0">
              <span className="text-[9px] font-black uppercase text-rose-500 tracking-widest mb-1 block">Recado de {partnerNick} 🧸:</span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 italic leading-relaxed">
                "{partnerNote}"
              </p>
            </div>

            {/* Camada interativa do Canvas para raspar */}
            <AnimatePresence>
              {!isScratchDone && (
                <motion.canvas
                  ref={canvasRef}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleMouseUp}
                  className="absolute inset-0 w-full h-full cursor-crosshair z-10 select-none touch-none"
                />
              )}
            </AnimatePresence>
          </div>

          {/* Bilhete que VOCÊ escreveu para ele(a) */}
          <div className="border-t border-slate-100 dark:border-white/5 pt-3 flex flex-col gap-1 px-1">
            <span className="text-[9px] font-black uppercase text-indigo-500 tracking-widest">O que você escreveu hoje 📝:</span>
            <p className="text-xs text-slate-500 italic">
              "{myNote}"
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

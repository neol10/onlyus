import '../styles/globals.css'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider, useAuth } from '../src/context/AuthContext'
import { applyThemeToDocument, getThemeSettingsKey, readThemeSettings, saveThemeSettings } from '../src/theme'
import AppLock from '../components/AppLock'
import { db } from '../src/firebase/firebaseClient'
import { doc, onSnapshot } from 'firebase/firestore'
import { useToast } from '../src/context/ToastContext'

function AppInner({ Component, pageProps }) {
  const { user, loading } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()
  
  useEffect(() => {
    if (loading) return
    const storageKey = getThemeSettingsKey(user?.uid)

    // Solicita permissão de notificação logo no início
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }

    const handleStorage = (event) => {
      if (event.key === storageKey || event.key === 'onlyus-active-user-id') {
        const currentSettings = readThemeSettings(storageKey)
        applyThemeToDocument(currentSettings)
      }
    }

    window.addEventListener('storage', handleStorage)

    // Listener Real-time do Firebase para Sincronização de Temas e Configurações
    let unsubFirestore = null
    if (user && db) {
      const userRef = doc(db, 'users', user.uid)
      unsubFirestore = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().settings) {
          const cloudSettings = docSnap.data().settings
          saveThemeSettings(storageKey, cloudSettings)
          applyThemeToDocument(cloudSettings)
        }
      })
    }

    // Listener Global de Notificações do Casal
    let unsubNotif = null
    if (user && db) {
      const userRef = doc(db, 'users', user.uid)
      onSnapshot(userRef, (uSnap) => {
        if (uSnap.exists() && uSnap.data().coupleId) {
          const cId = uSnap.data().coupleId
          const notifRef = doc(db, 'couples', cId, 'notifications', 'latest')
          unsubNotif = onSnapshot(notifRef, (nSnap) => {
            if (nSnap.exists()) {
              const notif = nSnap.data()
              // Só mostra se for recente (últimos 30 segundos) e não for do próprio autor
              if (notif.timestamp > Date.now() - 30000 && notif.from !== user.uid) {
                // 1. Toast In-App
                showToast(notif.message, notif.type === 'streak' ? 'success' : 'info')

                // 2. Notificação de Sistema
                if (typeof window !== 'undefined' && Notification.permission === 'granted') {
                  new Notification('OnlyUs ❤️', { 
                    body: notif.message, 
                    icon: '/logo.png',
                    badge: '/logo.png',
                    tag: 'onlyus-notif' 
                  })
                }
              }
            }
          })
        }
      })
    }

    return () => {
      window.removeEventListener('storage', handleStorage)
      if (unsubFirestore) unsubFirestore()
      if (unsubNotif) unsubNotif()
    }
  }, [user, loading])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
        {/* Fundo com gradientes animados */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 text-center"
        >
          <div className="relative inline-block mb-10">
            {/* Efeito de Glow Profundo */}
            <div className="absolute inset-[-20px] bg-indigo-500/30 blur-[60px] rounded-full animate-pulse" />
            <div className="absolute inset-[-20px] bg-rose-500/20 blur-[60px] rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
            
            <div className="relative w-28 h-28 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-2xl rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-rose-500/10" />
              <span className="relative text-white text-5xl font-black tracking-tighter drop-shadow-2xl">OU</span>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-white text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">OnlyUs</h2>
            <div className="flex items-center justify-center gap-2">
              <div className="w-1 h-1 bg-indigo-400 rounded-full animate-[bounce_1s_infinite]" />
              <div className="w-1 h-1 bg-rose-400 rounded-full animate-[bounce_1s_infinite_0.2s]" />
              <div className="w-1 h-1 bg-cyan-400 rounded-full animate-[bounce_1s_infinite_0.4s]" />
            </div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.5em] mt-6 opacity-60">Sincronizando seu universo</p>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <AppLock>
      <AnimatePresence mode="wait">
        <motion.div
          key={router.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1, ease: 'linear' }}
          className="min-h-screen"
        >
          <Component {...pageProps} />
        </motion.div>
      </AnimatePresence>
    </AppLock>
  )
}

import { ToastProvider } from '../src/context/ToastContext'

export default function App(props) {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppInner {...props} />
      </ToastProvider>
    </AuthProvider>
  )
}

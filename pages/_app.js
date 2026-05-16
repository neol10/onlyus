import '../styles/globals.css'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider, useAuth } from '../src/context/AuthContext'
import { applyThemeToDocument, getThemeSettingsKey, readThemeSettings, saveThemeSettings } from '../src/theme'
import AppLock from '../components/AppLock'
import { db } from '../src/firebase/firebaseClient'
import { doc, onSnapshot } from 'firebase/firestore'

function AppInner({ Component, pageProps }) {
  const { user, loading } = useAuth()
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
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center"
        >
          <div className="relative inline-block mb-8">
            {/* Efeito de Glow atrás da logo */}
            <div className="absolute inset-0 bg-[var(--ou-accent,#6366f1)] blur-[40px] opacity-40 animate-pulse" />
            
            <div className="relative w-24 h-24 bg-white dark:bg-slate-900 rounded-[2rem] flex items-center justify-center shadow-2xl border border-white/20">
              <span className="text-[var(--ou-accent,#6366f1)] text-4xl font-black tracking-tighter">OU</span>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-white text-2xl font-bold tracking-tight">OnlyUs</h2>
            <div className="flex items-center justify-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-4">Sincronizando seu universo</p>
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

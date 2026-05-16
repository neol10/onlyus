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

export default function App(props) {
  return (
    <AuthProvider>
      <AppInner {...props} />
    </AuthProvider>
  )
}

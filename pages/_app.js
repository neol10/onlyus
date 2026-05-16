import '../styles/globals.css'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider, useAuth } from '../src/context/AuthContext'
import { applyThemeToDocument, getThemeSettingsKey, readThemeSettings, saveThemeSettings } from '../src/theme'
import LockScreen from '../components/LockScreen'
import { db } from '../src/firebase/firebaseClient'
import { doc, onSnapshot } from 'firebase/firestore'

function AppInner({ Component, pageProps }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isLocked, setIsLocked] = useState(false)
  const [pinSettings, setPinSettings] = useState({ expectedPin: '', photo: '' })
  
  useEffect(() => {
    if (loading) return
    const storageKey = getThemeSettingsKey(user?.uid)

    // Removido readThemeSettings aqui para evitar o flicker do modo claro
    // O tema agora é aplicado via AuthContext assim que o perfil é carregado.

    const handleFocus = () => {
      // Sincroniza apenas se necessário
    }

    // Solicita permissão de notificação logo no início
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }

    // Registro Manual do SW em Dev (opcional, mas bom para teste local)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'development') {
       navigator.serviceWorker.register('/sw.js').then((reg) => {
         console.log('SW Registered in Dev:', reg.scope)
       }).catch((err) => {
         console.warn('SW Registration failed in Dev:', err)
       })
    }

    const handleStorage = (event) => {
      if (event.key === storageKey || event.key === 'onlyus-active-user-id') {
        const currentSettings = readThemeSettings(storageKey)
        applyThemeToDocument(currentSettings)
      }
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('storage', handleStorage)

    // Listener Real-time do Firebase
    let unsubFirestore = null
    if (user && db) {
      const userRef = doc(db, 'users', user.uid)
      unsubFirestore = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().settings) {
          const cloudSettings = docSnap.data().settings
          saveThemeSettings(storageKey, cloudSettings)
          applyThemeToDocument(cloudSettings)
          if (cloudSettings.pinEnabled && cloudSettings.pinCode) {
            setPinSettings({ expectedPin: cloudSettings.pinCode, photo: cloudSettings.pinPhoto })
          }
        }
      })
    }

    // Listener de Notificações do Casal (ex: Alimentar Pet)
    let unsubNotif = null
    if (user && db) {
      // Primeiro pegamos o perfil para saber o coupleId
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
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('storage', handleStorage)
      if (unsubFirestore) unsubFirestore()
      if (unsubNotif) unsubNotif()
    }
  }, [user, loading, router.pathname])

  const handleUnlock = () => {
    setIsLocked(false)
    sessionStorage.setItem('onlyus-unlocked', 'true')
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {isLocked && user ? (
          <motion.div key="lock-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-[100]">
            <LockScreen expectedPin={pinSettings.expectedPin} photo={pinSettings.photo} onUnlock={handleUnlock} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={router.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'linear' }}
          className="min-h-screen will-change-opacity"
        >
          <Component {...pageProps} />
        </motion.div>
      </AnimatePresence>
    </>
  )
}

export default function App(props) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && 'serviceWorker' in navigator) {
      // Em dev, limpamos apenas se houver conflito, mas agora estamos registrando um para teste
      // navigator.serviceWorker.getRegistrations().then((registrations) => {
      //   registrations.forEach((registration) => registration.unregister())
      // })
    }
  }, [])

  return (
    <AuthProvider>
      <AppInner {...props} />
    </AuthProvider>
  )
}

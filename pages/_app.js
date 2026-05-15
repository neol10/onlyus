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
    const settings = readThemeSettings(storageKey)
    applyThemeToDocument(settings)

    if (settings.pinEnabled && settings.pinCode && user) {
      setPinSettings({ expectedPin: settings.pinCode, photo: settings.pinPhoto })
      if (!sessionStorage.getItem('onlyus-unlocked')) {
        setIsLocked(true)
      }
    }

    const handleFocus = () => {
      const currentSettings = readThemeSettings(storageKey)
      if (currentSettings.pinEnabled && currentSettings.pinCode && user) {
        setIsLocked(true)
      }
    }

    const handleStorage = (event) => {
      if (event.key === storageKey || event.key === 'onlyus-active-user-id') {
        applyThemeToDocument(readThemeSettings(storageKey))
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

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('storage', handleStorage)
      if (unsubFirestore) unsubFirestore()
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
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="min-h-screen"
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
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister())
      })
      if ('caches' in window) {
        caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)))
      }
    }
  }, [])

  return (
    <AuthProvider>
      <AppInner {...props} />
    </AuthProvider>
  )
}

import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/firebaseClient'

const AuthContext = createContext({ user: null, profile: null, loading: true })

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return undefined
    }

    let unsubProfile = null

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      
      if (typeof window !== 'undefined') {
        if (u?.uid) window.localStorage.setItem('onlyus-active-user-id', u.uid)
        else window.localStorage.removeItem('onlyus-active-user-id')
      }

      if (u && db) {
        const userRef = doc(db, 'users', u.uid)
        unsubProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data()
            setProfile(data)
            
            // Escuta as configurações da sala do casal (Global)
            if (data.coupleId) {
              const coupleRef = doc(db, 'couples', data.coupleId)
              onSnapshot(coupleRef, (coupleSnap) => {
                if (coupleSnap.exists()) {
                  const coupleData = coupleSnap.data()
                  if (coupleData.settings && typeof window !== 'undefined') {
                    import('../theme').then(m => {
                      m.applyThemeToDocument(coupleData.settings)
                      const storageKey = m.getThemeSettingsKey(u.uid)
                      m.saveThemeSettings(storageKey, coupleData.settings)
                    })
                  }
                }
              })
            }
            
            setLoading(false)
          } else {
            const newProfile = {
              email: u.email,
              code: generateInviteCode(),
              coupleId: null,
              createdAt: Date.now()
            }
            setDoc(userRef, newProfile).then(() => {
              setProfile(newProfile)
              setLoading(false)
            }).catch(e => {
              console.error("Erro ao criar perfil:", e)
              setLoading(false)
            })
          }
        }, (error) => {
          console.error("Snapshot error no profile:", error)
          setLoading(false)
        })
      } else {
        setProfile(null)
        setLoading(false)
        if (unsubProfile) unsubProfile()
      }
    })

    return () => {
      unsubscribe()
      if (unsubProfile) unsubProfile()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export async function logout() {
  if (!auth) return
  return signOut(auth)
}

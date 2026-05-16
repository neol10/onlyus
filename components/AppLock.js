import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../src/context/AuthContext'

export default function AppLock({ children }) {
  const { profile, loading } = useAuth()
  const [isLocked, setIsLocked] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  const settings = useMemo(() => profile?.settings || {}, [profile])
  const pinEnabled = settings.pinEnabled
  const correctPin = settings.pinCode
  const biometricsEnabled = settings.biometricsEnabled
  const biometricCredentialId = settings.biometricCredentialId

  useEffect(() => {
    if (!loading && pinEnabled) {
      const isUnlocked = sessionStorage.getItem('app_unlocked') === 'true'
      if (!isUnlocked) {
        setIsLocked(true)
        if (biometricsEnabled) {
          // Pequeno delay para garantir que a UI carregou
          setTimeout(handleBiometricAuth, 800)
        }
      }
    }
  }, [loading, pinEnabled, biometricsEnabled])

  const handleBiometricAuth = async () => {
    try {
      if (!window.PublicKeyCredential) return
      
      const challenge = new Uint8Array(32)
      window.crypto.getRandomValues(challenge)

      // Configuração para FaceID/Digital
      const options = {
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: "required",
          allowCredentials: biometricCredentialId ? [{
            id: Uint8Array.from(atob(biometricCredentialId), c => c.charCodeAt(0)),
            type: 'public-key'
          }] : []
        }
      }

      const assertion = await navigator.credentials.get(options)
      if (assertion) {
        unlock()
      }
    } catch (err) {
      console.log('Erro ou cancelamento de biometria:', err)
      // Se falhou com ID específico, tenta o modo genérico
      if (biometricCredentialId) {
        try {
          const genericOptions = { publicKey: { challenge: new Uint8Array(32), timeout: 60000, userVerification: "required" } }
          const genericAssertion = await navigator.credentials.get(genericOptions)
          if (genericAssertion) unlock()
        } catch (e) {}
      }
    }
  }

  const unlock = () => {
    setIsLocked(false)
    sessionStorage.setItem('app_unlocked', 'true')
    setPin('')
  }

  const handleKeyPress = (num) => {
    if (error) return
    const nextPin = (pin + num).slice(0, 4)
    setPin(nextPin)
    
    if (nextPin.length === 4) {
      if (nextPin === correctPin) {
        unlock()
      } else {
        setError(true)
        setTimeout(() => {
          setError(false)
          setPin('')
        }, 600)
      }
    }
  }

  if (loading && !profile) return null

  return (
    <>
      <AnimatePresence initial={false}>
        {isLocked && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 overflow-hidden touch-none"
          >
            {settings.pinPhoto && (
              <div 
                className="absolute inset-0 z-0 opacity-20 blur-xl bg-cover bg-center scale-110"
                style={{ backgroundImage: `url(${settings.pinPhoto})`, willChange: 'transform' }}
              />
            )}

            <div className="relative z-10 w-full max-w-[340px] px-8 text-center">
              <motion.div 
                animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
                className="w-20 h-20 bg-gradient-to-br from-pink-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl mx-auto"
              >
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </motion.div>

              <h2 className="text-xl font-bold text-white mb-1">Cofre OnlyUs</h2>
              <p className="text-slate-400 text-xs mb-8">PIN ou Biometria</p>

              <div className="flex justify-center gap-4 mb-10">
                {[0, 1, 2, 3].map((i) => (
                  <div 
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full border-2 transition-all duration-200 ${
                      pin.length > i 
                        ? 'bg-white border-white scale-125 shadow-[0_0_8px_rgba(255,255,255,0.8)]' 
                        : 'border-white/20'
                    } ${error ? 'border-rose-500 bg-rose-500' : ''}`}
                  />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-x-6 gap-y-5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeyPress(num)}
                    className="h-16 w-16 rounded-full flex items-center justify-center text-3xl font-light text-white bg-white/5 active:bg-white/20 active:scale-90 transition-all mx-auto select-none"
                  >
                    {num}
                  </button>
                ))}
                
                <div className="flex items-center justify-center">
                  {biometricsEnabled && (
                    <button
                      type="button"
                      onClick={handleBiometricAuth}
                      className="h-16 w-16 rounded-full flex items-center justify-center text-indigo-400 bg-indigo-500/10 active:bg-indigo-500/30 transition-all"
                    >
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleKeyPress(0)}
                  className="h-16 w-16 rounded-full flex items-center justify-center text-3xl font-light text-white bg-white/5 active:bg-white/20 active:scale-90 transition-all mx-auto select-none"
                >
                  0
                </button>

                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setPin(pin.slice(0, -1))}
                    disabled={pin.length === 0}
                    className={`h-16 w-16 rounded-full flex items-center justify-center text-white bg-white/5 active:bg-white/20 active:scale-90 transition-all select-none ${pin.length === 0 ? 'opacity-0' : 'opacity-100'}`}
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 002.828 0L21 9" />
                    </svg>
                  </button>
                </div>
              </div>

              {biometricsEnabled && (
                <button 
                  onClick={handleBiometricAuth}
                  className="mt-8 text-xs font-semibold text-indigo-400 uppercase tracking-widest opacity-60 active:opacity-100"
                >
                  Tentar Biometria
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className={isLocked ? 'hidden' : 'block h-full'}>
        {children}
      </div>
    </>
  )
}

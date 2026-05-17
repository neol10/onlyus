import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../src/context/AuthContext'

export default function AppLock({ children }) {
  const { profile, loading } = useAuth()
  const [isLocked, setIsLocked] = useState(true)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [authStatus, setAuthStatus] = useState('')
  const [isMounted, setIsMounted] = useState(false)

  const settings = useMemo(() => profile?.settings || {}, [profile])
  const pinEnabled = settings.pinEnabled && !!settings.pinCode
  const correctPin = settings.pinCode
  // Biometria só é válida se tiver uma credencial cadastrada — sem ela, ignora o flag
  const biometricCredentialId = settings.biometricCredentialId
  const biometricsEnabled = settings.biometricsEnabled && !!biometricCredentialId

  const isSecurityActive = useMemo(() => pinEnabled || biometricsEnabled, [pinEnabled, biometricsEnabled])

  useEffect(() => {
    if (!loading) {
      const isUnlocked = sessionStorage.getItem('app_unlocked') === 'true'
      if (!isSecurityActive || isUnlocked) {
        setIsLocked(false)
      } else {
        setIsLocked(true)
      }
      setIsMounted(true)
    }
  }, [loading, isSecurityActive])

  const handleBiometricAuth = useCallback(async (e) => {
    if (e) e.preventDefault()
    if (!biometricsEnabled || !window.PublicKeyCredential) return

    try {
      setAuthStatus('Verificando biometria...')
      const challenge = new Uint8Array(32)
      window.crypto.getRandomValues(challenge)

      const options = {
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: "required",
        }
      }

      if (biometricCredentialId) {
        try {
          const rawId = Uint8Array.from(atob(biometricCredentialId.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
          options.publicKey.allowCredentials = [{ id: rawId, type: 'public-key' }]
        } catch (e) {}
      }

      const assertion = await navigator.credentials.get(options)
      if (assertion) {
        setAuthStatus('Acesso liberado!')
        unlock()
      }
    } catch (err) {
      console.log('Erro biometria:', err)
      setAuthStatus('Clique no escudo para tentar novamente')
    }
  }, [biometricsEnabled, biometricCredentialId])

  // Tenta biometria automática após carregar
  useEffect(() => {
    if (isLocked && biometricsEnabled && isMounted) {
      const timer = setTimeout(() => {
        handleBiometricAuth().catch(() => {})
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [isLocked, biometricsEnabled, isMounted, handleBiometricAuth])

  const unlock = () => {
    setIsLocked(false)
    sessionStorage.setItem('app_unlocked', 'true')
    setPin('')
    setAuthStatus('')
  }

  const handleKeyPress = (num) => {
    if (!pinEnabled || error) return
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

  if (!isMounted) return null

  return (
    <>
      <AnimatePresence mode="wait">
        {isLocked ? (
          <motion.div 
            key="lock-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 overflow-hidden touch-none"
          >
            {settings.vaultPhoto && (
              <div 
                className="absolute inset-0 z-0 opacity-30 blur-md bg-cover bg-center"
                style={{ backgroundImage: `url(${settings.vaultPhoto})` }}
              />
            )}

            <div className="relative z-10 w-full max-w-[320px] px-6 text-center">
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={handleBiometricAuth}
                animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
                className="w-24 h-24 bg-gradient-to-br from-pink-500 to-indigo-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl mx-auto cursor-pointer"
              >
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3c1.258 0 2.453.232 3.555.656m3.43 2.051A10.003 10.003 0 0121 12c0 1.258-.232 2.453-.656 3.555" />
                </svg>
              </motion.button>

              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Cofre OnlyUs</h2>
              <p className="text-slate-400 text-sm mb-10 font-medium">
                {authStatus || (biometricsEnabled ? 'Identidade Necessária' : 'Digite seu PIN')}
              </p>

              {/* Só mostra os pontos e o teclado se o PIN estiver habilitado */}
              {pinEnabled && (
                <>
                  <div className="flex justify-center gap-4 mb-12">
                    {[0, 1, 2, 3].map((i) => (
                      <div 
                        key={i}
                        className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                          pin.length > i 
                            ? 'bg-white border-white scale-110 shadow-[0_0_12px_rgba(255,255,255,0.4)]' 
                            : 'border-white/20'
                        } ${error ? 'border-rose-500 bg-rose-500' : ''}`}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-x-8 gap-y-6">
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
                    
                    <div className="w-16" />

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
                </>
              )}

              {/* Se apenas biometria estiver ativa, mostra um botão de tentativa manual maior se o auto falhar */}
              {!pinEnabled && biometricsEnabled && (
                <button 
                  onClick={handleBiometricAuth}
                  className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-sm font-semibold transition-all active:scale-95 border border-white/10"
                >
                  Tentar Biometria de Novo
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="app-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

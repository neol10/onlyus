import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../src/context/AuthContext'

export default function AppLock({ children }) {
  const { profile, loading } = useAuth()
  const [isLocked, setIsLocked] = useState(true) // Começa bloqueado por padrão se houver PIN
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [authStatus, setAuthStatus] = useState('')
  const [isMounted, setIsMounted] = useState(false)

  const settings = useMemo(() => profile?.settings || {}, [profile])
  const pinEnabled = settings.pinEnabled
  const correctPin = settings.pinCode
  const biometricsEnabled = settings.biometricsEnabled

  // Verifica estado de bloqueio inicial
  useEffect(() => {
    if (!loading) {
      const isUnlocked = sessionStorage.getItem('app_unlocked') === 'true'
      if (!pinEnabled || isUnlocked) {
        setIsLocked(false)
      }
      setIsMounted(true)
    }
  }, [loading, pinEnabled])

  const handleBiometricAuth = useCallback(async () => {
    if (!biometricsEnabled || !window.PublicKeyCredential) return

    try {
      setAuthStatus('Aguardando Biometria...')
      
      const challenge = new Uint8Array(32)
      window.crypto.getRandomValues(challenge)

      // Modo de autenticação simplificado (mais compatível)
      const options = {
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: "required",
          // Não passamos allowCredentials para forçar o navegador a pedir qualquer biometria válida do dono do cel
          authenticatorSelection: { 
            authenticatorAttachment: "platform",
            userVerification: "required"
          }
        }
      }

      const assertion = await navigator.credentials.get(options)
      if (assertion) {
        unlock()
      }
    } catch (err) {
      console.log('Erro biometria:', err)
      setAuthStatus('Biometria falhou. Use o PIN.')
      setTimeout(() => setAuthStatus(''), 3000)
    }
  }, [biometricsEnabled])

  // Dispara biometria automática ao montar se estiver travado
  useEffect(() => {
    if (isLocked && biometricsEnabled && isMounted) {
      const timer = setTimeout(handleBiometricAuth, 500)
      return () => clearTimeout(timer)
    }
  }, [isLocked, biometricsEnabled, isMounted, handleBiometricAuth])

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

  // Se ainda estiver carregando o perfil, não mostra nada para evitar flashes de UI
  if (!isMounted) return null

  return (
    <>
      <AnimatePresence mode="wait">
        {isLocked ? (
          <motion.div 
            key="lock-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 overflow-hidden touch-none"
          >
            {settings.pinPhoto && (
              <div 
                className="absolute inset-0 z-0 opacity-30 blur-md bg-cover bg-center scale-110"
                style={{ backgroundImage: `url(${settings.pinPhoto})` }}
              />
            )}

            <div className="relative z-10 w-full max-w-[320px] px-6 text-center">
              <motion.div 
                animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
                className="w-20 h-20 bg-gradient-to-br from-pink-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl mx-auto"
              >
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </motion.div>

              <h2 className="text-xl font-bold text-white mb-1">Cofre OnlyUs</h2>
              <p className="text-slate-400 text-xs mb-8">{authStatus || 'Protegido por PIN e Biometria'}</p>

              <div className="flex justify-center gap-4 mb-10">
                {[0, 1, 2, 3].map((i) => (
                  <div 
                    key={i}
                    className={`w-3 h-3 rounded-full border-2 transition-all duration-150 ${
                      pin.length > i 
                        ? 'bg-white border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]' 
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

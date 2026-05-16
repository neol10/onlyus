import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../src/context/AuthContext'

export default function AppLock({ children }) {
  const { user, profile, loading } = useAuth()
  const [isLocked, setIsLocked] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  const settings = profile?.settings || {}
  const pinEnabled = settings.pinEnabled
  const correctPin = settings.pinCode
  const biometricsEnabled = settings.biometricsEnabled

  useEffect(() => {
    if (!loading && pinEnabled) {
      // Verifica se já desbloqueou nesta sessão (opcional, mas bom para UX)
      const isUnlocked = sessionStorage.getItem('app_unlocked') === 'true'
      if (!isUnlocked) {
        setIsLocked(true)
        // Tenta biometria automaticamente se disponível
        if (biometricsEnabled) {
          handleBiometricAuth()
        }
      }
    }
  }, [loading, pinEnabled, biometricsEnabled])

  const handleBiometricAuth = async () => {
    try {
      const challenge = new Uint8Array(32)
      window.crypto.getRandomValues(challenge)

      const options = {
        challenge,
        timeout: 60000,
        userVerification: "required"
      }

      const assertion = await navigator.credentials.get({ publicKey: options })
      if (assertion) {
        unlock()
      }
    } catch (err) {
      console.log('Biometria ignorada ou falhou:', err)
    }
  }

  const unlock = () => {
    setIsLocked(false)
    sessionStorage.setItem('app_unlocked', 'true')
  }

  const handlePinSubmit = (e) => {
    e.preventDefault()
    if (pin === correctPin) {
      unlock()
    } else {
      setError(true)
      setPin('')
      setTimeout(() => setError(false), 500)
    }
  }

  if (loading) return children

  return (
    <>
      <AnimatePresence>
        {isLocked && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 p-6"
          >
            {/* Foto de Fundo Secreta */}
            {settings.pinPhoto && (
              <div 
                className="absolute inset-0 z-0 opacity-40 blur-sm bg-cover bg-center"
                style={{ backgroundImage: `url(${settings.pinPhoto})` }}
              />
            )}

            <div className="relative z-10 w-full max-w-xs text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl mx-auto">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Espaço Protegido</h2>
              <p className="text-slate-400 text-sm mb-8">Digite seu PIN para acessar as memórias do casal.</p>

              <form onSubmit={handlePinSubmit} className="space-y-6">
                <div className="flex justify-center gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <div 
                      key={i}
                      className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                        pin.length > i 
                          ? 'bg-white border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.5)]' 
                          : 'border-white/30'
                      } ${error ? 'border-rose-500 bg-rose-500 animate-shake' : ''}`}
                    />
                  ))}
                </div>

                <input 
                  autoFocus
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setPin(val)
                    if (val.length === 4 && val === correctPin) {
                      unlock()
                    } else if (val.length === 4) {
                      // Se errou o PIN após 4 dígitos
                      setError(true)
                      setPin('')
                      setTimeout(() => setError(false), 500)
                    }
                  }}
                  className="absolute opacity-0 pointer-events-none"
                />

                {/* Teclado Customizado (Opcional, mas melhora UX no Mobile) */}
                <div className="grid grid-cols-3 gap-4 mt-8">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0].map((num, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        if (num === '') return
                        const nextPin = (pin + num).slice(0, 4)
                        setPin(nextPin)
                      }}
                      className={`h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold text-white transition-colors active:bg-white/20 ${num === '' ? 'pointer-events-none' : 'bg-white/5'}`}
                    >
                      {num}
                    </button>
                  ))}
                  {biometricsEnabled && (
                    <button
                      type="button"
                      onClick={handleBiometricAuth}
                      className="h-16 w-16 rounded-full flex items-center justify-center bg-indigo-500/20 text-indigo-400 active:bg-indigo-500/40"
                    >
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPin(pin.slice(0, -1))}
                    className="h-16 w-16 rounded-full flex items-center justify-center bg-white/5 text-white active:bg-white/20"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 002.828 0L21 9" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>

            <style jsx>{`
              @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
              }
              .animate-shake {
                animation: shake 0.2s ease-in-out 0s 2;
              }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  )
}

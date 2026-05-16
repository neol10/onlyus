import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import NavBar from '../components/NavBar'
import { useAuth } from '../src/context/AuthContext'
import { db } from '../src/firebase/firebaseClient'
import { doc, setDoc, updateDoc } from 'firebase/firestore'
import { applyThemeToDocument, getThemeSettingsKey, readThemeSettings } from '../src/theme'

const DEFAULT_SETTINGS = {
  theme: 'Aurora',
  uiMode: 'Claro',
  primary: 'Azul gelo',
  secondary: 'Violeta',
  primaryHex: '#60a5fa',
  secondaryHex: '#8b5cf6',
  surfaceTone: 'Tema',
  surfaceHex: '#ffffff',
  backgroundIntensity: 70,
  motionIntensity: 60,
  privateFeed: true,
  pushNotifications: true,
  autoMemories: true,
  blurPhotos: false,
  pinOnPosts: false,
  pinEnabled: false,
  pinCode: '',
  pinPhoto: '',
  biometricsEnabled: false,
  biometricCredentialId: '',
  displayName: '',
  partnerNick: 'Amor'
}

const THEME_OPTIONS = ['Aurora', 'Midnight', 'Blossom', 'Noir', 'Custom']
const UI_MODE_OPTIONS = ['Claro', 'Escuro']
const SURFACE_OPTIONS = ['Tema', 'Pérola', 'Gelo', 'Areia', 'Fumê', 'Grafite', 'Personalizada']
const COLOR_OPTIONS = ['Azul gelo', 'Violeta', 'Rosa', 'Verde', 'Dourado', 'Personalizada']

const THEME_PREVIEWS = {
  Aurora: 'from-indigo-700 via-cyan-400 to-fuchsia-600',
  Midnight: 'from-slate-950 via-blue-900 to-sky-500',
  Blossom: 'from-rose-600 via-pink-500 to-amber-400',
  Noir: 'from-black via-zinc-800 to-slate-500',
  Custom: 'from-blue-600 via-violet-600 to-cyan-400',
}

const COLOR_SWATCHES = {
  'Azul gelo': 'bg-sky-400',
  Violeta: 'bg-violet-500',
  Rosa: 'bg-pink-500',
  Verde: 'bg-emerald-500',
  Dourado: 'bg-amber-500',
}

const COLOR_SWATCH_GRADIENTS = {
  'Azul gelo': 'from-sky-300 via-sky-400 to-blue-600',
  Violeta: 'from-violet-300 via-violet-500 to-indigo-700',
  Rosa: 'from-rose-300 via-pink-500 to-fuchsia-700',
  Verde: 'from-emerald-300 via-emerald-500 to-teal-700',
  Dourado: 'from-amber-200 via-amber-500 to-orange-700',
}

const SURFACE_SWATCHES = {
  Tema: 'bg-gradient-to-br from-slate-200 to-slate-50',
  'Pérola': 'bg-gradient-to-br from-white to-slate-100',
  Gelo: 'bg-gradient-to-br from-sky-50 to-blue-100',
  Areia: 'bg-gradient-to-br from-amber-50 to-orange-100',
  Fumê: 'bg-gradient-to-br from-slate-100 to-slate-200',
  Grafite: 'bg-gradient-to-br from-slate-700 to-slate-950',
  Personalizada: 'bg-gradient-to-br from-violet-400 via-fuchsia-500 to-cyan-400',
}

const SURFACE_PREVIEW_BG = {
  Tema: 'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(240,244,255,0.92))',
  'Pérola': 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(244,247,252,0.94))',
  Gelo: 'linear-gradient(145deg, rgba(239,246,255,0.98), rgba(224,242,254,0.94))',
  Areia: 'linear-gradient(145deg, rgba(255,248,240,0.98), rgba(254,243,199,0.92))',
  Fumê: 'linear-gradient(145deg, rgba(241,245,249,0.98), rgba(226,232,240,0.94))',
  Grafite: 'linear-gradient(145deg, rgba(15,23,42,0.98), rgba(30,41,59,0.95))',
  Personalizada: 'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(240,244,255,0.92))',
}

const SELECTED_STYLE = {
  borderColor: 'transparent',
  boxShadow: '0 0 0 2px var(--ou-accent), 0 0 0 6px color-mix(in srgb, var(--ou-accent-soft, rgba(99,102,241,0.24)) 78%, transparent)',
  transform: 'translateY(-1px)',
}

const PAIR_PRESETS = [
  { name: 'Romântico', primary: '#ec4899', secondary: '#8b5cf6' },
  { name: 'Céu Noturno', primary: '#2563eb', secondary: '#0f172a' },
  { name: 'Natureza', primary: '#10b981', secondary: '#0ea5e9' },
  { name: 'Solar', primary: '#f59e0b', secondary: '#ef4444' },
]

export default function SettingsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [settings, setSettings] = useState(null)
  const [localDisplayName, setLocalDisplayName] = useState('')
  const [localPartnerNick, setLocalPartnerNick] = useState('')
  const [savedAt, setSavedAt] = useState('')
  const [saving, setSaving] = useState(false)

  // 1. Bloqueio de acesso se não logado
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  // 2. Carregar configurações iniciais (Prioridade: Firestore > LocalStorage > Default)
  useEffect(() => {
    if (loading || !profile) return

    // Se já temos as configurações no perfil do Firestore, usamos elas
    if (profile.settings) {
      setSettings({ ...DEFAULT_SETTINGS, ...profile.settings })
      setLocalDisplayName(profile.settings.displayName || '')
      setLocalPartnerNick(profile.settings.partnerNick || 'Amor')
      applyThemeToDocument(profile.settings)
    } else {
      // Fallback para o que estiver no navegador
      const resolvedKey = getThemeSettingsKey(user?.uid)
      const persisted = readThemeSettings(resolvedKey)
      setSettings({ ...DEFAULT_SETTINGS, ...persisted })
      setLocalDisplayName(persisted.displayName || '')
      setLocalPartnerNick(persisted.partnerNick || 'Amor')
      applyThemeToDocument(persisted)
    }
  }, [loading, profile, user?.uid])

  // 3. Salvar mudanças
  const handleSave = async (explicitSettings = null) => {
    if (!settings && !explicitSettings) return
    setSaving(true)
    
    const finalSettings = explicitSettings || { 
      ...settings, 
      displayName: localDisplayName, 
      partnerNick: localPartnerNick 
    }
    
    setSettings(finalSettings)
    applyThemeToDocument(finalSettings)

    // Persistência Local
    const resolvedKey = getThemeSettingsKey(user?.uid)
    window.localStorage.setItem(resolvedKey, JSON.stringify(finalSettings))

    // Persistência no Firebase
    if (db && user?.uid) {
      try {
        const userRef = doc(db, 'users', user.uid)
        await setDoc(userRef, { settings: finalSettings }, { merge: true })
        
        // Se estiver em um casal, salva na sala apenas os temas e configurações compartilhadas
        if (profile?.coupleId) {
          const coupleRef = doc(db, 'couples', profile.coupleId)
          // Não salvamos displayName/partnerNick no coupleRef pois são individuais
          const { displayName, partnerNick, ...sharedSettings } = finalSettings
          await setDoc(coupleRef, { settings: sharedSettings }, { merge: true })
        }
        
        setSavedAt(new Date().toLocaleTimeString())
      } catch (err) {
        console.error('Erro ao salvar:', err)
        alert('Erro ao salvar. Tente novamente.')
      }
    }
    setSaving(false)
    if (!explicitSettings) alert('Configurações salvas! ✨')
  }

  // Função para Alternar Biometria (WebAuthn)
  const handleToggleBiometrics = async () => {
    if (settings.biometricsEnabled) {
      // Se já estiver ativado, apenas desativa
      updateSetting('biometricsEnabled', false)
      updateSetting('biometricCredentialId', '')
      handleSave({ ...settings, biometricsEnabled: false, biometricCredentialId: '' })
      return
    }

    try {
      if (!window.PublicKeyCredential) {
        alert('Seu dispositivo não suporta biometria no navegador.')
        return
      }

      const challenge = new Uint8Array(32)
      window.crypto.getRandomValues(challenge)

      const createCredentialDefaultOptions = {
        challenge,
        rp: { name: "OnlyUs", id: window.location.hostname },
        user: {
          id: Uint8Array.from(user.uid, c => c.charCodeAt(0)),
          name: user.email,
          displayName: profile.displayName || user.email,
        },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
        authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
        timeout: 60000,
        attestation: "none"
      }

      const credential = await navigator.credentials.create({
        publicKey: createCredentialDefaultOptions
      })

      if (credential) {
        const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))
        
        updateSetting('biometricsEnabled', true)
        updateSetting('biometricCredentialId', credentialId)
        
        alert('Biometria configurada com sucesso! 🛡️')
        handleSave({ 
          ...settings, 
          biometricsEnabled: true, 
          biometricCredentialId: credentialId 
        })
      }
    } catch (err) {
      console.error('Erro biometria:', err)
      alert('Não foi possível configurar a biometria. Verifique se seu dispositivo tem FaceID/Digital ativo.')
    }
  }

  const updateSetting = (key, value) => {
    if (!settings) return
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    applyThemeToDocument(newSettings)
  }

  if (loading || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-medium animate-pulse uppercase tracking-widest">Sincronizando Espaço...</p>
        </div>
      </div>
    )
  }

  const previewBg = settings.uiMode === 'Escuro'
    ? 'linear-gradient(145deg, rgba(15,23,42,0.98), rgba(30,41,59,0.95))'
    : (settings.surfaceTone === 'Personalizada'
      ? `linear-gradient(145deg, ${settings.surfaceHex || '#ffffff'}, ${settings.surfaceHex || '#ffffff'}dd)`
      : (SURFACE_PREVIEW_BG[settings.surfaceTone] || SURFACE_PREVIEW_BG.Tema))

  const previewTextClass = settings.uiMode === 'Escuro' ? 'text-slate-100' : 'text-slate-900'
  const previewMutedClass = settings.uiMode === 'Escuro' ? 'text-slate-400' : 'text-slate-500'
  const previewTileBg = settings.uiMode === 'Escuro' ? 'rgba(15,23,42,0.56)' : 'rgba(255,255,255,0.5)'

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="page-shell">
        <section className="mb-6 grid gap-4 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
          <div className="soft-card p-6 sm:p-8">
            <span className="theme-pill inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]" style={{ borderRadius: '999px' }}>
              Configurações
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Personalize o espaço de vocês.</h1>
            <p className="section-subtitle">
              Ajuste tema, cores, intensidade visual e preferências do app para deixar o OnlyUs com a identidade do casal.
            </p>
          </div>
          <div className="soft-card p-5 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Ações</p>
              <p className="mt-2 text-xs text-slate-400">{savedAt ? `Salvo às ${savedAt}` : 'Alterações pendentes'}</p>
            </div>
            <button 
              onClick={() => handleSave()}
              disabled={saving}
              className="mt-4 w-full py-3 bg-[var(--ou-accent)] text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.55fr]">
          <aside className="space-y-6">
            <div className="soft-card p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Conta</p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl px-4 py-3" style={{ background: 'linear-gradient(145deg, var(--ou-card-bg, rgba(255,255,255,0.92)), rgba(255,255,255,0.84))' }}>
                  <span className="block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Email</span>
                  <span className="mt-1 block text-sm font-medium text-slate-900">{user?.email || 'Não autenticado'}</span>
                </div>
                <div className="rounded-2xl px-4 py-3" style={{ background: 'linear-gradient(145deg, var(--ou-card-bg, rgba(255,255,255,0.92)), rgba(255,255,255,0.84))' }}>
                  <span className="block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Plano</span>
                  <span className="mt-1 block text-sm font-medium text-slate-900">Private couple</span>
                </div>
                <div className="rounded-2xl px-4 py-3" style={{ background: 'linear-gradient(145deg, var(--ou-card-bg, rgba(255,255,255,0.92)), rgba(255,255,255,0.84))' }}>
                  <span className="block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Status</span>
                  <span className="mt-1 block text-sm font-medium text-slate-900">Sincronizado</span>
                </div>
              </div>
            </div>

            <div className="soft-card p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Atalhos</p>
              <div className="mt-4 grid gap-3">
                <button className="secondary-button justify-between" type="button" onClick={() => updateSetting('theme', 'Aurora')}>
                  Restabelecer visual
                  <span className="text-xs text-slate-400">Aurora</span>
                </button>
                <button className="secondary-button justify-between" type="button" onClick={() => router.push('/timeline')}>
                  Abrir timeline
                  <span className="text-xs text-slate-400">Ir</span>
                </button>
                <button className="secondary-button justify-between" type="button" onClick={() => router.push('/')}>
                  Abrir feed
                  <span className="text-xs text-slate-400">Ir</span>
                </button>
              </div>
            </div>
          </aside>

          <section className="space-y-6">
            <div className="soft-card p-6 sm:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Identidade visual</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-5">
                {THEME_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => updateSetting('theme', option)}
                    className={`group overflow-hidden rounded-2xl border text-left transition hover:-translate-y-0.5 ${settings.theme === option ? 'border-transparent' : 'border-slate-200'}`}
                    style={settings.theme === option ? SELECTED_STYLE : undefined}
                  >
                    <div className={`h-16 bg-gradient-to-br ${THEME_PREVIEWS[option]}`} />
                    <div className="px-3 py-2" style={{ background: 'linear-gradient(145deg, var(--ou-card-bg, rgba(255,255,255,0.96)), rgba(255,255,255,0.84))' }}>
                      <p className="text-sm font-semibold text-slate-900">{option}</p>
                      <p className={`text-xs font-semibold ${settings.theme === option ? 'text-emerald-500' : 'text-slate-500'}`}>{settings.theme === option ? 'Selecionado' : 'Aplicar'}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="field-label">Tema</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {THEME_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updateSetting('theme', option)}
                        className="rounded-xl border px-3 py-2 text-left text-sm font-semibold transition hover:-translate-y-0.5"
                        style={settings.theme === option ? SELECTED_STYLE : { borderColor: 'var(--ou-border-soft, rgba(148,163,184,0.35))' }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="field-label">Modo de interface</label>
                  <div className="grid grid-cols-2 gap-2">
                    {UI_MODE_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updateSetting('uiMode', option)}
                        className="rounded-xl border px-3 py-2 text-left text-sm font-semibold transition hover:-translate-y-0.5"
                        style={settings.uiMode === option ? SELECTED_STYLE : { borderColor: 'var(--ou-border-soft, rgba(148,163,184,0.35))' }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="field-label">Cor das superfícies</label>
                  <div className="grid gap-2 sm:grid-cols-[110px_1fr]">
                    <input
                      type="color"
                      className="h-11 w-full cursor-pointer rounded-xl border border-slate-300 bg-transparent"
                      value={settings.surfaceHex || '#ffffff'}
                      onChange={(e) => {
                        updateSetting('surfaceTone', 'Personalizada')
                        updateSetting('surfaceHex', e.target.value)
                      }}
                    />
                    <input
                      type="text"
                      className="field-input"
                      placeholder="#ffffff"
                      value={settings.surfaceHex || '#ffffff'}
                      onChange={(e) => {
                        updateSetting('surfaceTone', 'Personalizada')
                        updateSetting('surfaceHex', e.target.value)
                      }}
                    />
                  </div>
                </div>
                <div>
                   <label className="field-label">Intensidade do fundo</label>
                   <input
                     className="field-input"
                     type="range"
                     min="0"
                     max="100"
                     value={settings.backgroundIntensity}
                     onChange={(e) => updateSetting('backgroundIntensity', Number(e.target.value))}
                   />
                   <p className="mt-2 text-xs text-slate-500">{settings.backgroundIntensity}%</p>
                 </div>
                 <div>
                   <label className="field-label">Intensidade das animações</label>
                   <input
                     className="field-input"
                     type="range"
                     min="0"
                     max="100"
                     value={settings.motionIntensity}
                     onChange={(e) => updateSetting('motionIntensity', Number(e.target.value))}
                   />
                   <p className="mt-2 text-xs text-slate-500">{settings.motionIntensity}%</p>
                 </div>
              </div>
            </div>

            <div className="soft-card p-6 sm:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Identidade do Casal</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label text-[10px] font-bold uppercase tracking-widest text-slate-400">Seu Nome/Apelido</label>
                  <input
                    className="field-input mt-1"
                    placeholder="Como você quer ser chamado?"
                    value={localDisplayName}
                    onChange={(e) => setLocalDisplayName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label text-[10px] font-bold uppercase tracking-widest text-slate-400">Apelido do Parceiro</label>
                  <input
                    className="field-input mt-1"
                    placeholder="Ex: Amor, Vida, Princesa..."
                    value={localPartnerNick}
                    onChange={(e) => setLocalPartnerNick(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="soft-card p-6 sm:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Privacidade e Seguranca</p>
              <div className="mt-5 space-y-4">
                <div className="flex flex-col gap-3">
                  <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 px-4 py-4 transition hover:border-slate-300 bg-white/50 dark:bg-white/5">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-900"
                      checked={settings.pinEnabled || false}
                      onChange={(e) => updateSetting('pinEnabled', e.target.checked)}
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">Bloqueio Geral (App)</span>
                      <span className="mt-1 block text-sm text-slate-600">Exigir PIN ou Biometria ao abrir o aplicativo.</span>
                    </span>
                  </label>

                  <div className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-4 bg-slate-50 dark:bg-white/5">
                    <div>
                      <span className="block text-sm font-bold text-slate-900 dark:text-white">Biometria (FaceID / Digital)</span>
                      <span className="mt-1 block text-xs text-slate-500">Usar reconhecimento nativo para desbloqueio.</span>
                    </div>
                    <button 
                      onClick={handleToggleBiometrics}
                      className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${settings.biometricsEnabled ? 'bg-emerald-100 text-emerald-600 shadow-sm' : 'bg-slate-200 dark:bg-white/10 text-slate-600'}`}
                    >
                      {settings.biometricsEnabled ? 'Desativar ✓' : 'Ativar'}
                    </button>
                  </div>
                </div>

                {settings.pinEnabled && (
                  <div className="grid gap-4 sm:grid-cols-2 mt-2">
                    <div>
                      <label className="field-label">Código (PIN de 4 dígitos)</label>
                      <input
                        type="password"
                        maxLength={4}
                        className="field-input"
                        placeholder="Ex: 1234"
                        value={settings.pinCode || ''}
                        onChange={(e) => updateSetting('pinCode', e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                    <div>
                      <label className="field-label">Foto de fundo do cofre</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="field-file"
                        onChange={async (e) => {
                          const file = e.target.files[0]
                          if (file) {
                            try {
                              const formData = new FormData()
                              formData.append('file', file)
                              formData.append('upload_preset', 'etx8raxe')
                              const res = await fetch('https://api.cloudinary.com/v1_1/dftwoo90i/image/upload', { method: 'POST', body: formData })
                              const data = await res.json()
                              if (data.secure_url) updateSetting('pinPhoto', data.secure_url)
                            } catch (err) { alert('Erro no upload') }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
                
                <div className="pt-4 space-y-3">
                  {[
                    ['blurPhotos', 'Ocultar prévia de fotos', 'As fotos ficarão desfocadas no feed.'],
                    ['pinOnPosts', 'PIN individual em posts', 'Proteção extra em cada memória.'],
                  ].map(([key, title, description]) => (
                    <label key={key} className="flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 px-4 py-4 transition hover:border-slate-300 bg-white/50 dark:bg-white/5">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        checked={settings[key]}
                        onChange={(e) => updateSetting(key, e.target.checked)}
                      />
                      <span>
                        <span className="block text-sm font-bold text-slate-900 dark:text-white">{title}</span>
                        <span className="mt-1 block text-xs text-slate-500">{description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="soft-card p-6 sm:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Preview Visual</p>
              <div className={`mt-4 overflow-hidden rounded-3xl border border-white/80 p-5 shadow-lg ${previewTextClass}`} style={{ background: previewBg }}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className={`text-xs uppercase tracking-[0.28em] ${previewMutedClass}`}>OnlyUs live</p>
                    <p className="mt-2 text-lg font-semibold">{settings.theme}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${THEME_PREVIEWS[settings.theme] || THEME_PREVIEWS.Aurora}`} />
                </div>
              </div>
            </div>
          </section>
        </section>
      </main>
    </div>
  )
}

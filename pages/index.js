import Link from 'next/link'
import NavBar from '../components/NavBar'
import PostCard from '../components/PostCard'
import NewPostForm from '../components/NewPostForm'
import LoveTimer from '../components/LoveTimer'
import LovePing from '../components/LovePing'
import ThrowbackCard from '../components/ThrowbackCard'
import CollabRoom from '../components/CollabRoom'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../src/context/AuthContext'
import { collection, query, orderBy, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../src/firebase/firebaseClient'
import MusicCard from '../components/MusicCard'
import LocationCard from '../components/LocationCard'
import { useToast } from '../src/context/ToastContext'

export default function Home() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState([])
  const [coupleData, setCoupleData] = useState({ relationshipDate: '', myMood: '🥰', pinOnPosts: false, blurPhotos: false, pinCode: '' })
  const [isEditingDate, setIsEditingDate] = useState(false)
  const [postsUnlocked, setPostsUnlocked] = useState(false)
  const [showMoodSelector, setShowMoodSelector] = useState(false)

  const MOOD_OPTIONS = ['🥰', '❤️', '😊', '🤩', '😴', '😢', '😤', '🥺', '🤯', '🥵']

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (loading || !user || !db || !profile?.coupleId) return
    
    // Busca os posts apenas DENTRO da sala do casal
    const q = query(collection(db, 'couples', profile.coupleId, 'posts'), orderBy('createdAt', 'desc'))
    const unsubPosts = onSnapshot(q, (snapshot) => {
      const arr = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setPosts(arr)
    })

    // Escuta os dados da sala do casal (Data, Humores, etc)
    const coupleRef = doc(db, 'couples', profile.coupleId)
    const unsubCouple = onSnapshot(coupleRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        const partnerId = data.partnerA === user.uid ? data.partnerB : data.partnerA
        
        setCoupleData({
          relationshipDate: data.relationshipDate || '',
          myMood: data.moods?.[user.uid] || '🥰',
          partnerMood: data.moods?.[partnerId] || '🥰',
          partnerNick: profile?.settings?.partnerNick || 'O Amor',
          partnerId: partnerId,
          pinOnPosts: data.settings?.pinOnPosts || false,
          blurPhotos: data.settings?.blurPhotos || false,
          pinCode: data.settings?.pinCode || '',
          theme: data.settings?.theme || 'Aurora'
        })
      }
    })

    // Escuta Notificações em Tempo Real
    const notifRef = doc(db, 'couples', profile.coupleId, 'notifications', 'latest')
    const unsubNotif = onSnapshot(notifRef, (docSnap) => {
      if (docSnap.exists()) {
        const notif = docSnap.data()
        // Só notifica se for do parceiro e for recente (últimos 30s)
        if (notif.from !== user.uid && Date.now() - notif.timestamp < 30000) {
          if (typeof window !== 'undefined' && Notification.permission === 'granted') {
            new Notification('OnlyUs ❤️', { body: notif.message, icon: '/logo.png' })
          }
        }
      }
    })

    return () => { unsubPosts(); unsubCouple(); unsubNotif() }
  }, [user, profile?.coupleId, loading])

  const { showToast } = useToast()

  const sendLoveNotification = async () => {
    if (!profile?.coupleId || !user) return
    const notifRef = doc(db, 'couples', profile.coupleId, 'notifications', 'latest')
    await setDoc(notifRef, {
      from: user.uid,
      message: `${profile.displayName || 'Seu Amor'} te mandou um carinho! ❤️`,
      timestamp: Date.now(),
      type: 'love'
    })
    showToast('Carinho enviado! ❤️')
  }

  const saveCoupleData = async (newData) => {
    if (!user || !db || !profile?.coupleId) return
    const coupleRef = doc(db, 'couples', profile.coupleId)
    
    if (newData.myMood) {
      // Usar dot notation para não sobrescrever o humor do parceiro
      await updateDoc(coupleRef, {
        [`moods.${user.uid}`]: newData.myMood
      })

      // Enviar notificação de humor
      const notifRef = doc(db, 'couples', profile.coupleId, 'notifications', 'latest')
      await setDoc(notifRef, {
        from: user.uid,
        message: `${profile.displayName || 'Seu Amor'} atualizou o humor para: ${newData.myMood}`,
        timestamp: Date.now(),
        type: 'mood'
      })
    }
    
    if (newData.relationshipDate !== undefined) {
      await updateDoc(coupleRef, { 
        relationshipDate: newData.relationshipDate 
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl animate-bounce mx-auto">
            <span className="text-white font-black text-xl">O</span>
          </div>
          <p className="text-white/50 text-xs font-bold uppercase tracking-[0.3em] animate-pulse">Sincronizando Amor...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen">
      <NavBar />
      
      {!profile?.coupleId ? (
        <CollabRoom />
      ) : (
        <>
          <LovePing />
          <main className="page-shell">
            <section className="mb-6 grid gap-4 lg:grid-cols-[1.4fr_0.8fr] lg:items-start">
            <div className="flex flex-col gap-4">
              <div className="soft-card p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              </div>
              
              <div>
                <span className="theme-pill inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] rounded-full">
                  Nosso Tempo
                </span>
                
                <div className="mt-6 mb-4">
                  {coupleData.relationshipDate && !isEditingDate ? (
                    <div onClick={() => setIsEditingDate(true)} className="cursor-pointer group">
                      <LoveTimer startDate={coupleData.relationshipDate} />
                      <p className="text-xs text-slate-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Toque para editar a data</p>
                    </div>
                  ) : (
                    <div className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-xl backdrop-blur-sm border border-[var(--ou-accent-soft)]">
                      <p className="text-sm font-medium mb-2">Quando a história começou?</p>
                      <div className="flex gap-2">
                        <input 
                          type="date" 
                          value={coupleData.relationshipDate}
                          onChange={(e) => saveCoupleData({ relationshipDate: e.target.value })}
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--ou-accent)]"
                        />
                        <button onClick={() => setIsEditingDate(false)} className="px-4 bg-[var(--ou-accent)] text-white rounded-lg text-sm font-semibold">Salvar</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <MusicCard coupleId={profile?.coupleId} />
          </div>

          <div className="soft-card grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-1">
            <LocationCard coupleId={profile?.coupleId} />
            <div className="rounded-2xl px-4 py-3 bg-gradient-to-br from-[var(--ou-card-bg)] to-[var(--ou-card-bg-2)] relative overflow-hidden">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-700 dark:text-slate-300">Live Presence</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Sincronizados</span>
              </div>
            </div>
            
            <div className="rounded-2xl px-4 py-3 bg-gradient-to-br from-[var(--ou-card-bg)] to-[var(--ou-card-bg-2)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-700 dark:text-slate-300 mb-2">Seu Humor</p>
                  <div className="flex items-center gap-2 relative">
                    <button 
                      onClick={() => setShowMoodSelector(!showMoodSelector)}
                      className="text-3xl drop-shadow-md hover:scale-110 transition-transform active:scale-95"
                    >
                      {coupleData.myMood}
                    </button>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Alterar</span>

                    {showMoodSelector && (
                      <div className="absolute top-10 left-0 z-50 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl p-3 border border-slate-200 dark:border-white/10 grid grid-cols-5 gap-2 w-48 animate-in fade-in zoom-in duration-200">
                        {MOOD_OPTIONS.map(emoji => (
                          <button 
                            key={emoji}
                            onClick={() => {
                              saveCoupleData({ myMood: emoji })
                              setShowMoodSelector(false)
                            }}
                            className="text-2xl hover:bg-slate-100 dark:hover:bg-white/5 p-1 rounded-lg transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-700 dark:text-slate-300 mb-2">{coupleData.partnerNick}</p>
                  <span className="text-3xl drop-shadow-md">{coupleData.partnerMood}</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl px-4 py-3 bg-gradient-to-br from-[var(--ou-card-bg)] to-[var(--ou-card-bg-2)]">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-700 dark:text-slate-300">Total de Memórias</p>
              <p className="mt-1 text-lg font-semibold text-[var(--ou-accent)]">{posts.length} momentos gravados</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.55fr]">
          <div className="space-y-6">
            <NewPostForm />
            <ThrowbackCard posts={posts} />
            <div className="soft-card p-5">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-slate-700 dark:text-slate-300">Dica</p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">Toque no botão de coração flutuante a qualquer momento para enviar uma animação carinhosa de surpresa.</p>
            </div>
          </div>

          <section className="space-y-4">
            {posts.length === 0 && (
              <div className="soft-card p-8 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Ainda vazio</p>
                <p className="mt-3 text-lg font-medium text-slate-900 dark:text-slate-100">Nenhum post — comece adicionando memórias.</p>
              </div>
            )}
            
            {coupleData.pinOnPosts && !postsUnlocked ? (
              <div className="soft-card p-10 text-center flex flex-col items-center justify-center bg-slate-950 text-white border-none shadow-2xl">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Memórias Protegidas</h3>
                <p className="text-slate-400 text-sm mb-6 max-w-xs">Este feed exige o seu PIN de segurança para ser visualizado.</p>
                <button 
                  onClick={() => {
                    const pin = prompt('Digite o PIN de segurança:')
                    // Aqui pegamos o pinCode que está nos settings da sala
                    if (pin === coupleData.pinCode) {
                      setPostsUnlocked(true)
                    } else {
                      alert('PIN incorreto')
                    }
                  }}
                  className="px-8 py-3 bg-white text-slate-950 rounded-full font-bold text-sm hover:scale-105 transition-transform"
                >
                  Desbloquear Feed
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map(p => (
                  <PostCard key={p.id} post={p} settings={coupleData} />
                ))}
              </div>
            )}
          </section>
        </section>
      </main>
      </>
      )}
    </div>
  )
}

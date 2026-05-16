import { useState } from 'react'
import { collection, query, where, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../src/firebase/firebaseClient'
import { useAuth } from '../src/context/AuthContext'

export default function CollabRoom() {
  const { user, profile, loading: authLoading } = useAuth()
  const [partnerCode, setPartnerCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLinkPartner = async () => {
    if (!profile) return
    if (!partnerCode.trim()) {
      setError('Por favor, insira o código do parceiro.')
      return
    }
    if (partnerCode.trim().toUpperCase() === profile.code) {
      setError('Você não pode vincular consigo mesmo.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Procura o usuário parceiro pelo código
      const q = query(collection(db, 'users'), where('code', '==', partnerCode.trim().toUpperCase()))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        setError('Código inválido ou parceiro não encontrado.')
        setLoading(false)
        return
      }

      const partnerDoc = querySnapshot.docs[0]
      const partnerId = partnerDoc.id
      const partnerData = partnerDoc.data()

      if (partnerData.coupleId) {
        setError('Este parceiro já está vinculado a outra pessoa.')
        setLoading(false)
        return
      }

      // Criar a Sala de Collab (Couple)
      const newCoupleId = `room_${user.uid.substring(0, 5)}_${partnerId.substring(0, 5)}_${Date.now()}`
      
      const newCoupleData = {
        createdAt: Date.now(),
        partnerA: user.uid,
        partnerB: partnerId,
        moods: { [user.uid]: '🥰', [partnerId]: '🥰' },
        settings: { relationshipDate: '', theme: 'Aurora' }
      }
      
      await setDoc(doc(db, 'couples', newCoupleId), newCoupleData)

      // Atualizar o profile de ambos para incluir o coupleId
      await updateDoc(doc(db, 'users', user.uid), { coupleId: newCoupleId })
      await updateDoc(doc(db, 'users', partnerId), { coupleId: newCoupleId })

      // Como o AuthContext usa onSnapshot em 'users/uid', 
      // a tela vai recarregar magicamente sozinha quando coupleId existir!
    } catch (err) {
      console.error(err)
      setError('Ocorreu um erro ao conectar os perfis.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[var(--ou-bg)] to-[var(--ou-card-bg-2)]">
      <div className="soft-card max-w-md w-full p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--ou-accent)]/10 to-transparent opacity-30"></div>
        
        <div className="relative z-10">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-rose-500 to-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-rose-500/20">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Conecte-se ao seu Parceiro</h1>
          <p className="text-slate-500 text-sm mb-8">
            Para iniciar o seu espaço privado "Only Us", vocês precisam conectar os perfis usando um código de acesso.
          </p>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Seu Código de Convite</p>
            <p className="text-3xl font-black tracking-[0.2em] text-[var(--ou-accent)]">
              {profile?.code || '------'}
            </p>
            <p className="text-xs text-slate-500 mt-2">Envie este código para seu parceiro(a)</p>
          </div>

          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-semibold uppercase tracking-widest text-slate-400">OU INSERIR CÓDIGO DELE(A)</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          <div className="mt-4 text-left">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Código do Parceiro</label>
            <input
              type="text"
              placeholder="Ex: A1B2C3"
              value={partnerCode}
              onChange={e => setPartnerCode(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-lg font-bold text-center uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-[var(--ou-accent)] transition-all"
            />
            {error && <p className="mt-2 text-sm text-rose-500 text-center font-medium">{error}</p>}
            
            <button
              onClick={handleLinkPartner}
              disabled={loading}
              className="mt-6 w-full py-4 px-4 bg-gradient-to-r from-[var(--ou-theme-accent,#0f172a)] to-[var(--ou-accent,#4f46e5)] text-white text-sm font-bold uppercase tracking-widest rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Conectando...' : 'Vincular Corações'}
            </button>

            <button
              onClick={() => {
                import('../src/firebase/firebaseClient').then(m => {
                  import('firebase/auth').then(a => {
                    a.signOut(m.auth);
                  });
                });
              }}
              className="mt-4 w-full py-2 text-slate-500 text-xs font-semibold uppercase tracking-widest hover:text-rose-500 transition-colors"
            >
              Sair da conta
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

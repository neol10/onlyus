import { useState } from 'react'
import { storage, db } from '../src/firebase/firebaseClient'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '../src/context/AuthContext'

export default function NewPostForm() {
  const { user, profile } = useAuth()
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [isBlurred, setIsBlurred] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [notifyPartner, setNotifyPartner] = useState(false)

  const handleFile = (e) => {
    setFile(e.target.files[0])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return alert('Selecione uma imagem')
    if (!profile?.coupleId) return alert('Você não está em uma sala de casal')

    setUploading(true)
    try {
      const storageRef = ref(storage, `couples/${profile.coupleId}/${Date.now()}_${file.name}`)
      const uploadTask = uploadBytesResumable(storageRef, file)

      uploadTask.on('state_changed', (snapshot) => {
        const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        setProgress(Math.round(prog))
      }, (err) => {
        throw err
      }, async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref)
        await addDoc(collection(db, 'couples', profile.coupleId, 'posts'), {
          caption: caption,
          images: [url],
          createdAt: Date.now(),
          authorId: user ? user.uid : null,
          isBlurred: isBlurred,
          isLocked: isLocked,
          notifyPartner: notifyPartner,
        })
        setCaption('')
        setFile(null)
        setProgress(0)
        setUploading(false)
        setIsBlurred(false)
        setIsLocked(false)
        setNotifyPartner(true)
      })
    } catch (err) {
      console.error('Upload error', err)
      alert('Erro ao enviar imagem')
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="soft-card p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Publicar</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">Novo post</h3>
        </div>
        <span className="theme-pill px-3 py-1 text-xs font-semibold text-slate-700" style={{ borderRadius: '999px' }}>Privado</span>
      </div>
      <input type="file" accept="image/*" onChange={handleFile} className="field-file mb-3" />
      <input
        placeholder="Legenda"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        className="field-input mb-3"
      />
      
      <div className="mb-4 flex flex-wrap gap-4">
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">
          <input 
            type="checkbox" 
            checked={isBlurred} 
            onChange={e => setIsBlurred(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
          />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Desfocar Foto</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">
          <input 
            type="checkbox" 
            checked={isLocked} 
            onChange={e => setIsLocked(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
          />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Exigir PIN</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-pink-200 bg-pink-50/30 px-3 py-2 transition hover:bg-pink-50 dark:border-pink-500/20 dark:bg-pink-500/5">
          <input 
            type="checkbox" 
            checked={notifyPartner} 
            onChange={e => setNotifyPartner(e.target.checked)}
            className="h-4 w-4 rounded border-pink-300 text-pink-600 focus:ring-pink-500" 
          />
          <span className="text-xs font-bold text-pink-700 dark:text-pink-400">Marcar {profile?.settings?.partnerNick || 'o Amor'} 🔔</span>
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button className="primary-button disabled:cursor-not-allowed disabled:opacity-60" disabled={uploading}>
          {uploading ? `Enviando (${progress}%)` : 'Publicar'}
        </button>
        {uploading && <div className="text-sm font-medium text-slate-600">{progress}%</div>}
      </div>
      {uploading && (
        <div className="mt-4 h-2 overflow-hidden rounded-full" style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.72), rgba(226,232,240,0.9))' }}>
          <div className="h-full rounded-full bg-gradient-to-r from-slate-950 via-blue-600 to-violet-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
    </form>
  )
}

import { useState } from 'react'
import { storage, db } from '../src/firebase/firebaseClient'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore'
import { useAuth } from '../src/context/AuthContext'

import { useToast } from '../src/context/ToastContext'

export default function NewPostForm() {
  const { user, profile } = useAuth()
  const { showToast } = useToast()
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState(null)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [isBlurred, setIsBlurred] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [notifyPartner, setNotifyPartner] = useState(false)

  const handleFile = (e) => {
    setFile(e.target.files[0])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return showToast('Selecione uma imagem', 'error')
    if (!profile?.coupleId) return showToast('Você não está em uma sala de casal', 'error')

    setUploading(true)
    setProgress(0)

    try {
      // Configurações do Cloudinary
      const cloudName = 'dftwoo90i'
      const uploadPreset = 'etx8raxe'
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`

      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', uploadPreset)

      // Usando XMLHttpRequest para acompanhar o progresso do upload
      const xhr = new XMLHttpRequest()
      xhr.open('POST', url, true)

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100)
          setProgress(percent)
        }
      }

      xhr.onload = async () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          const imageUrl = response.secure_url

          // Salva os dados no Firestore (Firebase continua dono da organização)
          await addDoc(collection(db, 'couples', profile.coupleId, 'posts'), {
            caption: caption,
            images: [imageUrl],
            createdAt: Date.now(),
            authorId: user ? user.uid : null,
            isBlurred: isBlurred,
            isLocked: isLocked,
            notifyPartner: notifyPartner,
          })

          // Enviar notificação se marcado
          if (notifyPartner) {
            const notifRef = doc(db, 'couples', profile.coupleId, 'notifications', 'latest')
            await setDoc(notifRef, {
              from: user.uid,
              message: `${profile.displayName || 'Seu Amor'} publicou uma nova memória! 📸`,
              timestamp: Date.now(),
              type: 'post'
            })
          }

          setCaption('')
          setFile(null)
          setProgress(0)
          setUploading(false)
          setIsBlurred(false)
          setIsLocked(false)
          setNotifyPartner(false)
          showToast('Memória publicada! ✨')
        } else {
          console.error('Cloudinary error', xhr.responseText)
          showToast('Erro no servidor de imagens', 'error')
          setUploading(false)
        }
      }

      xhr.onerror = () => {
        showToast('Falha na conexão ao subir imagem', 'error')
        setUploading(false)
      }

      xhr.send(formData)

    } catch (err) {
      console.error('Upload error', err)
      showToast('Erro ao processar imagem', 'error')
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
      
      <div className="mb-4 space-y-3">
        <label className="flex cursor-pointer items-center justify-between gap-2 rounded-2xl border-2 border-pink-100 bg-pink-50/50 p-4 transition hover:bg-pink-100 dark:border-pink-500/10 dark:bg-pink-500/5 dark:hover:bg-pink-500/10">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-500 text-white shadow-lg shadow-pink-500/20">🔔</div>
            <div>
              <p className="text-xs font-bold text-pink-700 dark:text-pink-400">Notificar {profile?.settings?.partnerNick || 'o Amor'}</p>
              <p className="text-[10px] text-pink-600/70 dark:text-pink-400/50">Enviar alerta push para o parceiro ver agora</p>
            </div>
          </div>
          <input 
            type="checkbox" 
            checked={notifyPartner} 
            onChange={e => setNotifyPartner(e.target.checked)}
            className="h-5 w-5 rounded-full border-pink-300 text-pink-600 focus:ring-pink-500 transition-all cursor-pointer" 
          />
        </label>

        <div className="flex gap-2">
          <label className="flex-1 flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-3 transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">
            <input 
              type="checkbox" 
              checked={isBlurred} 
              onChange={e => setIsBlurred(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
            />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Desfocar Foto</span>
          </label>
          <label className="flex-1 flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-3 transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">
            <input 
              type="checkbox" 
              checked={isLocked} 
              onChange={e => setIsLocked(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
            />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Exigir PIN</span>
          </label>
        </div>
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

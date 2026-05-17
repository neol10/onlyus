import { useState, useRef } from 'react'
import { db } from '../src/firebase/firebaseClient'
import { collection, addDoc, doc, setDoc } from 'firebase/firestore'
import { useAuth } from '../src/context/AuthContext'
import { useToast } from '../src/context/ToastContext'

const CLOUDINARY_CLOUD = 'dftwoo90i'
const CLOUDINARY_PRESET = 'etx8raxe'
const MAX_PHOTOS = 10

function uploadToCloudinary(file, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', CLOUDINARY_PRESET)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, true)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText).secure_url)
      } else {
        reject(new Error('Upload falhou'))
      }
    }
    xhr.onerror = () => reject(new Error('Falha de conexão'))
    xhr.send(formData)
  })
}

export default function NewPostForm() {
  const { user, profile } = useAuth()
  const { showToast } = useToast()
  const inputRef = useRef(null)

  const [caption, setCaption] = useState('')
  const [files, setFiles] = useState([])      // Array de { file, preview }
  const [progresses, setProgresses] = useState([])
  const [uploading, setUploading] = useState(false)
  const [isBlurred, setIsBlurred] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [notifyPartner, setNotifyPartner] = useState(false)

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files).slice(0, MAX_PHOTOS - files.length)
    const newEntries = selected.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }))
    setFiles(prev => [...prev, ...newEntries].slice(0, MAX_PHOTOS))
    setProgresses(prev => [...prev, ...selected.map(() => 0)].slice(0, MAX_PHOTOS))
    // Limpa o input para permitir re-selecionar o mesmo arquivo
    e.target.value = ''
  }

  const removeFile = (index) => {
    setFiles(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
    setProgresses(prev => prev.filter((_, i) => i !== index))
  }

  const totalProgress = progresses.length > 0
    ? Math.round(progresses.reduce((a, b) => a + b, 0) / progresses.length)
    : 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (files.length === 0) return showToast('Selecione pelo menos uma imagem', 'error')
    if (!profile?.coupleId) return showToast('Você não está em uma sala de casal', 'error')

    setUploading(true)

    try {
      // Upload paralelo de todas as imagens
      const uploadPromises = files.map((entry, i) =>
        uploadToCloudinary(entry.file, (pct) => {
          setProgresses(prev => {
            const next = [...prev]
            next[i] = pct
            return next
          })
        })
      )

      const imageUrls = await Promise.all(uploadPromises)

      await addDoc(collection(db, 'couples', profile.coupleId, 'posts'), {
        caption,
        images: imageUrls,
        createdAt: Date.now(),
        authorId: user?.uid || null,
        isBlurred,
        isLocked,
        notifyPartner,
      })

      if (notifyPartner) {
        const notifRef = doc(db, 'couples', profile.coupleId, 'notifications', 'latest')
        await setDoc(notifRef, {
          from: user.uid,
          message: `${profile.settings?.displayName || 'Seu Amor'} publicou uma nova memória! 📸`,
          timestamp: Date.now(),
          type: 'post'
        })
      }

      // Limpar tudo
      files.forEach(f => URL.revokeObjectURL(f.preview))
      setFiles([])
      setProgresses([])
      setCaption('')
      setIsBlurred(false)
      setIsLocked(false)
      setNotifyPartner(false)
      showToast(`${imageUrls.length > 1 ? `${imageUrls.length} fotos publicadas` : 'Memória publicada'}! ✨`)
    } catch (err) {
      console.error('Upload error', err)
      showToast('Erro ao enviar imagens', 'error')
    } finally {
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

      {/* Área de seleção de fotos */}
      <div className="mb-4">
        {files.length === 0 ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl py-10 flex flex-col items-center gap-3 text-slate-400 hover:border-indigo-400 hover:text-indigo-400 transition-all"
          >
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-semibold">Toque para selecionar fotos</span>
            <span className="text-xs opacity-60">Até {MAX_PHOTOS} fotos — carrossel automático</span>
          </button>
        ) : (
          <div>
            {/* Grid de previews */}
            <div className={`grid gap-2 mb-3 ${files.length === 1 ? 'grid-cols-1' : files.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {files.map((entry, i) => (
                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-white/5 group">
                  <img
                    src={entry.preview}
                    alt={`preview-${i}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Progresso individual */}
                  {uploading && progresses[i] < 100 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs font-black">{progresses[i]}%</span>
                    </div>
                  )}
                  {uploading && progresses[i] === 100 && (
                    <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {/* Botão remover */}
                  {!uploading && (
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  {/* Badge de índice */}
                  <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                    {i + 1}
                  </div>
                </div>
              ))}

              {/* Botão adicionar mais (se não chegou no limite) */}
              {files.length < MAX_PHOTOS && !uploading && (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-indigo-400 hover:text-indigo-400 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-[9px] font-bold">Adicionar</span>
                </button>
              )}
            </div>

            <p className="text-[10px] text-slate-400 font-semibold text-center uppercase tracking-wider mb-2">
              {files.length} {files.length === 1 ? 'foto' : 'fotos'} selecionada{files.length > 1 ? 's' : ''} · Carrossel
            </p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFiles}
          className="hidden"
        />
      </div>

      <input
        placeholder="Legenda..."
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        className="field-input mb-4"
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

      <button
        className="primary-button w-full disabled:cursor-not-allowed disabled:opacity-60"
        disabled={uploading || files.length === 0}
      >
        {uploading ? `Enviando... ${totalProgress}%` : `Publicar ${files.length > 1 ? `(${files.length} fotos)` : ''}`}
      </button>

      {uploading && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 transition-all duration-300"
            style={{ width: `${totalProgress}%` }}
          />
        </div>
      )}
    </form>
  )
}

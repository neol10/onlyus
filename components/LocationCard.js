import { useEffect, useState, useRef } from 'react'
import { doc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore'
import { db } from '../src/firebase/firebaseClient'
import { useAuth } from '../src/context/AuthContext'

export default function LocationCard({ coupleId }) {
  const { user, profile } = useAuth()
  const [partnerLocation, setPartnerLocation] = useState(null)
  const [myLocation, setMyLocation] = useState(null)
  const [partnerInfo, setPartnerInfo] = useState(null)
  const mapRef = useRef(null)
  const leafletMap = useRef(null)
  const markersRef = useRef({})

  // 1. Identificar quem é o parceiro
  useEffect(() => {
    if (!coupleId || !user) return
    
    const fetchPartner = async () => {
      const coupleSnap = await getDoc(doc(db, 'couples', coupleId))
      if (coupleSnap.exists()) {
        const data = coupleSnap.data()
        const partnerId = data.partnerA === user.uid ? data.partnerB : data.partnerA
        
        // Escutar localização do parceiro
        const unsubPartner = onSnapshot(doc(db, 'users', partnerId), (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data()
            setPartnerInfo(userData)
            setPartnerLocation(userData.lastLocation || null)
          }
        })
        return () => unsubPartner()
      }
    }
    fetchPartner()
  }, [coupleId, user])

  // 2. Rastrear minha própria localização
  useEffect(() => {
    if (!user) return

    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: Date.now()
          }
          setMyLocation(loc)
          
          // Salvar no Firestore
          updateDoc(doc(db, 'users', user.uid), {
            lastLocation: loc
          }).catch(console.error)
        },
        (error) => console.error("Erro GPS:", error),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      )
      return () => navigator.geolocation.clearWatch(watchId)
    }
  }, [user])

  // 3. Inicializar e atualizar o mapa (Client-side only)
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return

    // Carregamento dinâmico do Leaflet
    const initMap = async () => {
      const L = (await import('leaflet')).default
      
      if (!leafletMap.current) {
        leafletMap.current = L.map(mapRef.current, {
          zoomControl: false,
          attributionControl: false
        }).setView([0, 0], 2)

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
        }).addTo(leafletMap.current)
      }

      const L_map = leafletMap.current

      // Função para criar ícone customizado
      const createIcon = (photoUrl, isMe) => {
        return L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="w-10 h-10 rounded-full border-2 ${isMe ? 'border-indigo-500' : 'border-rose-500'} overflow-hidden shadow-lg bg-white">
                  <img src="${photoUrl || 'https://ui-avatars.com/api/?name=' + (isMe ? 'Eu' : 'Amor')}" class="w-full h-full object-cover" />
                </div>
                <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 ${isMe ? 'bg-indigo-500' : 'bg-rose-500'} rotate-45 shadow-sm"></div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 40]
        })
      }

      // Atualizar Marcadores
      const updateMarker = (id, loc, isMe, info) => {
        if (!loc) return
        if (markersRef.current[id]) {
          markersRef.current[id].setLatLng([loc.lat, loc.lng])
        } else {
          markersRef.current[id] = L.marker([loc.lat, loc.lng], {
            icon: createIcon(info?.photoURL || info?.settings?.pinPhoto, isMe)
          }).addTo(L_map)
        }
      }

      updateMarker('me', myLocation, true, profile)
      updateMarker('partner', partnerLocation, false, partnerInfo)

      // Ajustar visão para mostrar ambos
      const points = []
      if (myLocation) points.push([myLocation.lat, myLocation.lng])
      if (partnerLocation) points.push([partnerLocation.lat, partnerLocation.lng])

      if (points.length > 0) {
        const bounds = L.latLngBounds(points)
        L_map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
      }
    }

    initMap()
  }, [myLocation, partnerLocation, partnerInfo, profile])

  return (
    <div className="soft-card overflow-hidden h-[320px] relative group">
      <div ref={mapRef} className="w-full h-full z-0" />
      
      <div className="absolute top-4 left-4 z-10">
        <span className="theme-pill bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest shadow-xl flex items-center gap-2 border border-white/20">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Onde estamos agora
        </span>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-white/20 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
             </div>
             <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Status do Parceiro</p>
                <p className="text-xs font-bold text-slate-800 dark:text-white">
                  {partnerLocation ? 'Localizado agora' : 'Buscando posição...'}
                </p>
             </div>
          </div>
          
          <button 
            onClick={() => {
              if (partnerLocation && leafletMap.current) {
                leafletMap.current.flyTo([partnerLocation.lat, partnerLocation.lng], 16)
              }
            }}
            className="p-2 bg-[var(--ou-accent)] text-white rounded-xl shadow-lg shadow-indigo-500/20 active:scale-90 transition-all"
          >
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
             </svg>
          </button>
        </div>
      </div>

      <style jsx global>{`
        .leaflet-container { background: transparent !important; }
        .custom-div-icon { background: none !important; border: none !important; }
      `}</style>
    </div>
  )
}

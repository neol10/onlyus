import { useEffect, useState, useRef } from 'react'
import { doc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore'
import { db } from '../src/firebase/firebaseClient'
import { useAuth } from '../src/context/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function LocationCard({ coupleId }) {
  const { user, profile } = useAuth()
  const [partnerLocation, setPartnerLocation] = useState(null)
  const [myLocation, setMyLocation] = useState(null)
  const [partnerInfo, setPartnerInfo] = useState(null)
  const [address, setAddress] = useState('Carregando endereço...')
  const [distance, setDistance] = useState(null)
  const mapRef = useRef(null)
  const leafletMap = useRef(null)
  const markersRef = useRef({})

  // 1. Identificar quem é o parceiro e escutar localização
  useEffect(() => {
    if (!coupleId || !user) return
    
    const fetchPartner = async () => {
      const coupleSnap = await getDoc(doc(db, 'couples', coupleId))
      if (coupleSnap.exists()) {
        const data = coupleSnap.data()
        const partnerId = data.partnerA === user.uid ? data.partnerB : data.partnerA
        
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

  // 2. Rastrear minha localização
  useEffect(() => {
    if (!user) return
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude, timestamp: Date.now() }
          setMyLocation(loc)
          updateDoc(doc(db, 'users', user.uid), { lastLocation: loc }).catch(console.error)
        },
        (error) => console.error("GPS Error:", error),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      )
      return () => navigator.geolocation.clearWatch(watchId)
    }
  }, [user])

  // 3. Reverse Geocoding (Nominatim) e Cálculo de Distância
  useEffect(() => {
    if (!partnerLocation) return

    const getAddress = async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${partnerLocation.lat}&lon=${partnerLocation.lng}&zoom=18&addressdetails=1`)
        const data = await res.json()
        const addr = data.address
        const display = addr.road ? `${addr.road}${addr.house_number ? ', ' + addr.house_number : ''}` : data.display_name.split(',')[0]
        setAddress(display)
      } catch (e) { setAddress('Localização Privada') }
    }

    if (myLocation && partnerLocation) {
      const R = 6371 // Raio da Terra em km
      const dLat = (partnerLocation.lat - myLocation.lat) * Math.PI / 180
      const dLon = (partnerLocation.lng - myLocation.lng) * Math.PI / 180
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(myLocation.lat * Math.PI / 180) * Math.cos(partnerLocation.lat * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      setDistance((R * c).toFixed(1))
    }

    getAddress()
  }, [partnerLocation, myLocation])

  // 4. Mapa e Marcadores
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return

    const initMap = async () => {
      const L = (await import('leaflet')).default
      if (!leafletMap.current) {
        leafletMap.current = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView([0, 0], 2)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(leafletMap.current)
      }

      const L_map = leafletMap.current
      const createIcon = (photoUrl, isMe) => L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="relative group">
                <div class="w-12 h-12 rounded-full border-4 ${isMe ? 'border-indigo-500 shadow-indigo-500/30' : 'border-rose-500 shadow-rose-500/30'} overflow-hidden shadow-2xl bg-white transition-transform group-hover:scale-110">
                  <img src="${photoUrl || 'https://ui-avatars.com/api/?name=' + (isMe ? 'Eu' : 'Amor')}" class="w-full h-full object-cover" />
                </div>
                <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 ${isMe ? 'bg-indigo-500' : 'bg-rose-500'} rotate-45 shadow-lg"></div>
              </div>`,
        iconSize: [48, 48],
        iconAnchor: [24, 48]
      })

      const updateMarker = (id, loc, isMe, info) => {
        if (!loc) return
        if (markersRef.current[id]) {
          markersRef.current[id].setLatLng([loc.lat, loc.lng])
        } else {
          markersRef.current[id] = L.marker([loc.lat, loc.lng], { icon: createIcon(info?.settings?.radarPhoto || info?.photoURL, isMe) }).addTo(L_map)
        }
      }

      updateMarker('me', myLocation, true, profile)
      updateMarker('partner', partnerLocation, false, partnerInfo)

      const points = []
      if (myLocation) points.push([myLocation.lat, myLocation.lng])
      if (partnerLocation) points.push([partnerLocation.lat, partnerLocation.lng])
      if (points.length > 0) L_map.fitBounds(L.latLngBounds(points), { padding: [60, 60], maxZoom: 15 })
    }
    initMap()
  }, [myLocation, partnerLocation, partnerInfo, profile])

  return (
    <div className="soft-card overflow-hidden h-[380px] relative flex flex-col">
      <div ref={mapRef} className="flex-1 z-0" />
      
      {/* Info Overlay Top */}
      <div className="absolute top-4 left-4 right-4 z-10 pointer-events-none flex justify-between items-start">
        <span className="theme-pill bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest shadow-xl flex items-center gap-2 border border-white/20 pointer-events-auto">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Live Radar
        </span>
        
        {distance && (
          <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest shadow-xl border border-indigo-400/50 pointer-events-auto">
            {distance} KM DE DISTÂNCIA
          </div>
        )}
      </div>

      {/* Status Card Bottom */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4 rounded-[2rem] shadow-2xl border border-white/20 flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg border-2 border-rose-500/20">
              <img 
                src={partnerInfo?.settings?.radarPhoto || partnerInfo?.photoURL || 'https://ui-avatars.com/api/?name=Amor'} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-0.5">
              Onde está {profile?.settings?.partnerNick || 'o Amor'}
            </p>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {partnerLocation ? address : 'Buscando sinal GPS...'}
            </h3>
            {partnerLocation && (
              <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tighter mt-0.5">
                Atualizado {formatDistanceToNow(partnerLocation.timestamp, { addSuffix: true, locale: ptBR })}
              </p>
            )}
          </div>

          <button 
            onClick={() => partnerLocation && leafletMap.current?.flyTo([partnerLocation.lat, partnerLocation.lng], 17)}
            className="w-10 h-10 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-90 shadow-inner"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>
      </div>

      <style jsx global>{`
        .leaflet-container { background: transparent !important; filter: contrast(1.1) saturate(1.1); }
        .custom-div-icon { background: none !important; border: none !important; }
      `}</style>
    </div>
  )
}

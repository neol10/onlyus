/**
 * Script de limpeza: remove campos de segurança individuais
 * que foram incorretamente salvos na coleção "couples" do Firestore.
 * 
 * Execute UMA VEZ: node scripts/fix-couple-security.mjs
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, updateDoc, deleteField } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCRirvwJiNr0lby9Sd1Ph8fWNH08zjHZG4",
  authDomain: "onlyus-340c4.firebaseapp.com",
  projectId: "onlyus-340c4",
  storageBucket: "onlyus-340c4.firebasestorage.app",
  messagingSenderId: "986821547683",
  appId: "1:986821547683:web:c0ba9bb9413df524395116"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const SECURITY_FIELDS_TO_REMOVE = [
  'settings.pinEnabled',
  'settings.pinCode',
  'settings.biometricsEnabled',
  'settings.biometricCredentialId',
  'settings.vaultPhoto',
]

async function run() {
  console.log('🔍 Buscando todas as salas de casais...')
  const couplesSnap = await getDocs(collection(db, 'couples'))
  
  if (couplesSnap.empty) {
    console.log('Nenhuma sala encontrada.')
    return
  }

  for (const coupleDoc of couplesSnap.docs) {
    const data = coupleDoc.data()
    const settings = data.settings || {}
    
    const fieldsPresent = Object.keys(settings).filter(k =>
      ['pinEnabled', 'pinCode', 'biometricsEnabled', 'biometricCredentialId', 'vaultPhoto'].includes(k)
    )

    if (fieldsPresent.length === 0) {
      console.log(`✅ Sala ${coupleDoc.id}: limpa, nenhum campo de segurança encontrado.`)
      continue
    }

    console.log(`🔧 Sala ${coupleDoc.id}: removendo campos [${fieldsPresent.join(', ')}]...`)
    
    const updatePayload = {}
    for (const field of fieldsPresent) {
      updatePayload[`settings.${field}`] = deleteField()
    }

    await updateDoc(doc(db, 'couples', coupleDoc.id), updatePayload)
    console.log(`✅ Sala ${coupleDoc.id}: campos de segurança removidos com sucesso!`)
  }

  console.log('\n🎉 Limpeza concluída! A parceira poderá entrar normalmente agora.')
}

run().catch(err => {
  console.error('❌ Erro durante a limpeza:', err)
  process.exit(1)
})

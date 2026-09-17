import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { collection, doc, getDoc, getDocs, orderBy, query, where } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import Carrossel from '../components/Carrossel'
import BottomNav from '../components/BottomNav'
import AvaliarVisitaCTA from '../components/AvaliarVisitaCTA'
import ComentariosLista from '../components/ComentariosLista'
import { formatDataLonga } from '../lib/validators'

const LOGO_URL = '/images/logo-ccg.png'
const MASCOTE_URL = '/images/mascote-capivara-crop.png'
const HERO_URL = '/images/hero-obra.png'
const VISITANTES_PADRAO = 120

const SELOS = [
  { linhas: ['Experiência', 'autêntica'], icone: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6f8a3f" strokeWidth="1.6"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" strokeLinecap="round" /></svg>
  )},
  { linhas: ['Segurança em', 'primeiro lugar'], icone: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6f8a3f" strokeWidth="1.6"><path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
  )},
  { linhas: ['Conhecimento', 'que conecta'], icone: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6f8a3f" strokeWidth="1.6"><path d="M4 8h3l2-2h6l2 2h3v11H4V8z" strokeLinejoin="round" /><circle cx="12" cy="13" r="3.3" /></svg>
  )},
]

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [fotos, setFotos] = useState([])
  const [visitas, setVisitas] = useState([])
  const [visitantes, setVisitantes] = useState(VISITANTES_PADRAO)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function carregar() {
      try {
        const fotosSnap = await getDocs(query(collection(db, 'carrossel'), orderBy('ordem')))
        setFotos(fotosSnap.docs.map((d) => d.data()))
        const hojeISO = new Date().toISOString().slice(0, 10)
        const visitasSnap = await getDocs(query(collection(db, 'visitas'), where('data', '>=', hojeISO), orderBy('data', 'asc')))
        setVisitas(visitasSnap.docs.map((d) => {
          const v = d.data()
          const capacidade = v.capacidadePorHorario ?? 22
          const ocupadas08 = v.vagas08Ocupadas ?? 0
          const ocupadas10 = v.vagas10Ocupadas ?? 0
          const restantes = capacidade * 2 - (ocupadas08 + ocupadas10)
          return { id: d.id, ...v, restantes }
        }))
        const configSnap = await getDoc(doc(db, 'configuracoes', 'geral'))
        if (configSnap.exists() && configSnap.data().visitantesParticipantes) setVisitantes(configSnap.data().visitantesParticipantes)
      } finally { setCarregando(false) }
    }
    carregar()
  }, [])

  async function handleSair() { await signOut(auth); navigate('/login') }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <div className="max-w-2xl mx-auto bg-white min-h-screen">
        <header className="flex items-center justify-between px-6 py-5 border-b border-navy/[0.07]">
          <div className="flex items-center gap-2.5">
            <img src={LOGO_URL} alt="Consórcio Construtor Gávea" className="h-[19px] w-auto object-contain" />
            <span className="text-[12.5px] font-medium text-navy">{user?.displayName ?? user?.email}</span>
          </div>
          <button onClick={handleSair} className="text-[12.5px] text-navy/40 hover:text-navy/70 transition">Sair</button>
        </header>

        <div className="relative overflow-hidden bg-mint">
          <img src={HERO_URL} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #f6f9f0 22%, rgba(246,249,240,0.85) 42%, rgba(246,249,240,0.35) 65%, rgba(246,249,240,0) 95%)' }} />
          <div className="relative z-10 px-6 py-7">
            <h1 className="font-poppins font-extrabold text-navy leading-[1.05] text-[32px] mb-3">Conecta<br /><span className="text-green">Gávea</span></h1>
            <p className="text-[13px] text-navy/70 mb-5">Visita guiada à <strong className="text-navy">Estação Gávea</strong> · Linha 4</p>
            <div className="flex items-start justify-between gap-2 max-w-[300px]">
              {SELOS.map((selo) => (
                <div key={selo.linhas[0]} className="flex-1 flex flex-col items-center text-center gap-1.5">
                  <div className="w-12 h-12 rounded-full border border-green flex items-center justify-center bg-white/70">{selo.icone}</div>
                  <p className="text-[10.5px] font-semibold text-navy leading-tight">{selo.linhas[0]}<br />{selo.linhas[1]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pt-6">
          <div className="w-[22px] h-[3px] bg-greenfill rounded mb-2" />
          <h2 className="text-[14.5px] font-semibold text-navy mb-0.5">Próximas visitas</h2>
          <p className="text-xs text-navy/40 mb-3.5">Clique na data para se inscrever</p>
          {carregando ? <p className="text-sm text-navy/35">Carregando visitas...</p> : visitas.length === 0 ? <p className="text-sm text-navy/35">Nenhuma visita programada no momento.</p> : (
            <div className="flex flex-col gap-2 mb-7">
              {visitas.map((visita) => {
                const lotada = visita.restantes <= 0
                return (
                  <button key={visita.id} disabled={lotada} onClick={() => navigate(`/inscricao/${visita.id}`)} className={`flex items-center justify-between px-3.5 py-3 rounded-[10px] border transition ${lotada ? 'border-navy/[0.08] opacity-50 cursor-not-allowed' : 'border-navy/10 hover:border-navy/25'}`}>
                    <span className="flex items-center gap-2.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6f8a3f" strokeWidth="1.6"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" strokeLinecap="round" /></svg>
                      <span className="text-sm font-medium text-navy">{formatDataLonga(new Date(visita.data + 'T00:00:00'))}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${lotada ? 'text-navy/35' : 'text-green'}`}>{lotada ? 'Esgotado' : `${visita.restantes} vagas`}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="rgba(18,33,58,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          <div className="flex items-center gap-3.5 bg-mint rounded-xl px-3.5 py-3 mb-7" style={{ border: '1px solid rgba(139,197,63,0.3)' }}>
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-full bg-[#eef3e5] flex items-center justify-center overflow-hidden"><img src={MASCOTE_URL} alt="Mascote" className="w-[85%] h-[85%] object-contain" /></div>
              <div className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-greenfill flex items-center justify-center" style={{ boxShadow: '0 1px 3px rgba(18,33,58,0.2)' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#12213a" strokeWidth="2"><path d="M5 3v18" strokeLinecap="round" /><path d="M5 4h12l-2 4 2 4H5" strokeLinejoin="round" /></svg>
              </div>
            </div>
            <div><p className="text-xs font-semibold text-navy mb-0.5">Vem conhecer a obra!</p><p className="text-xs text-navy/55 leading-snug">Inscreva-se na próxima visita guiada à Estação Gávea.</p></div>
          </div>

          <h2 className="text-[15px] font-bold text-navy mb-0.5">Veja como foi a última visita</h2>
          <p className="text-[12.5px] text-navy/50 mb-2.5">Curiosos com a obra? Garanta seu lugar na próxima.</p>
          <div className="relative mb-7">
            <Carrossel fotos={fotos} />
            {fotos.length > 0 && <span className="absolute bottom-2.5 left-2.5 bg-greenfill text-navy text-[11px] font-bold px-2.5 py-1 rounded-full">+{visitantes} visitantes já participaram</span>}
          </div>

          <AvaliarVisitaCTA />
          <ComentariosLista />
        </div>

        <div className="h-8" />
      </div>
      <BottomNav />
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import {
  collectionGroup,
  doc,
  getDocs,
  query,
  runTransaction,
  where,
} from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import { formatDataLonga } from '../lib/validators'

const DIAS_ANTES_PARA_CONFIRMAR = 2
const LOGO_URL = '/images/logo-ccg.png'
const MASCOTE_URL = '/images/mascote-capivara-crop.png'

function extrairVisitaId(refPath) {
  const partes = refPath.split('/')
  return partes[partes.length - 3]
}

export default function MinhasInscricoes() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [inscricoes, setInscricoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [paraCancelar, setParaCancelar] = useState(null)
  const [processando, setProcessando] = useState(false)

  useEffect(() => {
    carregar()
  }, [user])

  async function carregar() {
    if (!user) return
    setCarregando(true)
    try {
      const q = query(collectionGroup(db, 'inscricoes'), where('uid', '==', user.uid))
      const snap = await getDocs(q)
      const lista = snap.docs
        .map((d) => ({
          id: d.id,
          ref: d.ref,
          visitaId: extrairVisitaId(d.ref.path),
          ...d.data(),
        }))
        .filter((i) => !i.cancelada)
        .sort((a, b) => a.visitaId.localeCompare(b.visitaId))
      setInscricoes(lista)
    } finally {
      setCarregando(false)
    }
  }

  async function handleSair() {
    await signOut(auth)
    navigate('/login')
  }

  function statusConfirmacao(inscricao) {
    if (inscricao.confirmadoPresenca) {
      return { podeConfirmar: false, jaConfirmado: true, textoAjuda: null }
    }

    const dataVisita = new Date(inscricao.visitaId + 'T00:00:00')
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const limiteAbertura = new Date(dataVisita)
    limiteAbertura.setDate(limiteAbertura.getDate() - DIAS_ANTES_PARA_CONFIRMAR)

    if (hoje < limiteAbertura) {
      return {
        podeConfirmar: false,
        jaConfirmado: false,
        textoAjuda: `Disponível a partir de ${formatDataLonga(limiteAbertura)}`,
      }
    }

    if (hoje > dataVisita) {
      return { podeConfirmar: false, jaConfirmado: false, textoAjuda: 'Visita já ocorreu' }
    }

    return { podeConfirmar: true, jaConfirmado: false, textoAjuda: null }
  }

  async function confirmarPresenca(inscricao) {
    setProcessando(true)
    try {
      await runTransaction(db, async (tx) => {
        tx.update(inscricao.ref, {
          confirmadoPresenca: true,
          statusConfirmacaoSincronizada: false,
        })
      })
      setInscricoes((atual) =>
        atual.map((i) =>
          i.id === inscricao.id ? { ...i, confirmadoPresenca: true } : i
        )
      )
    } finally {
      setProcessando(false)
    }
  }

  async function confirmarCancelamento() {
    if (!paraCancelar) return
    setProcessando(true)
    try {
      await runTransaction(db, async (tx) => {
        const visitaRef = doc(db, 'visitas', paraCancelar.visitaId)
        const visitaSnap = await tx.get(visitaRef)
        if (visitaSnap.exists()) {
          const v = visitaSnap.data()
          const campo =
            paraCancelar.horario === '08h30' ? 'vagas08Ocupadas' : 'vagas10Ocupadas'
          const atual = v[campo] ?? 0
          tx.update(visitaRef, { [campo]: Math.max(0, atual - 1) })
        }
        tx.update(paraCancelar.ref, {
          cancelada: true,
          removidoDaPlanilha: false,
        })
      })
      setInscricoes((atual) => atual.filter((i) => i.id !== paraCancelar.id))
      setParaCancelar(null)
    } finally {
      setProcessando(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <div className="max-w-2xl mx-auto bg-white min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-6 py-5 border-b border-navy/[0.07]">
          <div className="flex items-center gap-2.5">
            <img src={LOGO_URL} alt="Consórcio Construtor Gávea" className="h-[19px] w-auto object-contain" />
            <span className="text-[12.5px] font-medium text-navy">
              {user?.displayName ?? user?.email}
            </span>
          </div>
          <button onClick={handleSair} className="text-[12.5px] text-navy/40 hover:text-navy/70 transition">
            Sair
          </button>
        </header>

        <main className="flex-1 px-6 pt-7 pb-6">
          <h1 className="text-[19px] font-semibold text-navy tracking-tight mb-6">
            Minhas inscrições
          </h1>

          <div
            className="flex items-center gap-3.5 bg-mint rounded-xl px-3.5 py-3 mb-6"
            style={{ border: '1px solid rgba(139,197,63,0.3)' }}
          >
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-full bg-[#eef3e5] flex items-center justify-center overflow-hidden">
                <img src={MASCOTE_URL} alt="Mascote" className="w-[85%] h-[85%] object-contain" />
              </div>
              <div
                className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-greenfill flex items-center justify-center"
                style={{ boxShadow: '0 1px 3px rgba(18,33,58,0.2)' }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#12213a" strokeWidth="2">
                  <path d="M5 3v18" strokeLinecap="round" />
                  <path d="M5 4h12l-2 4 2 4H5" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-navy mb-0.5">Suas inscrições ficam aqui!</p>
              <p className="text-xs text-navy/55 leading-snug">
                Acompanhe as visitas confirmadas e acesse seus comprovantes.
              </p>
            </div>
          </div>

          {carregando ? (
            <p className="text-sm text-navy/35 mb-8">Carregando...</p>
          ) : inscricoes.length === 0 ? (
            <p className="text-sm text-navy/35 mb-8">
              Você ainda não tem inscrições em visitas.
            </p>
          ) : (
            <div className="flex flex-col gap-3 mb-8">
              {inscricoes.map((inscricao) => {
                const status = statusConfirmacao(inscricao)
                return (
                  <div key={inscricao.id} className="border border-navy/10 rounded-xl px-4 py-4">
                    <p className="text-sm font-semibold text-navy">
                      {formatDataLonga(new Date(inscricao.visitaId + 'T00:00:00'))}
                    </p>
                    <p className="text-xs text-navy/50 mt-0.5">
                      {inscricao.horario} · {inscricao.nomeCompleto}
                    </p>

                    <div className="flex items-center gap-2 mt-3.5">
                      <button
                        onClick={() => setParaCancelar(inscricao)}
                        className="flex-1 border border-navy/15 rounded-lg py-2 text-xs font-medium text-navy/60 hover:border-red-300 hover:text-red-500 transition"
                      >
                        Cancelar visita
                      </button>

                      {status.jaConfirmado ? (
                        <span className="flex-1 text-center bg-mint text-green rounded-lg py-2 text-xs font-semibold">
                          Presença confirmada
                        </span>
                      ) : (
                        <button
                          onClick={() => confirmarPresenca(inscricao)}
                          disabled={!status.podeConfirmar || processando}
                          title={status.textoAjuda || ''}
                          className="flex-1 bg-navy text-white rounded-lg py-2 text-xs font-medium hover:opacity-90 transition disabled:opacity-35 disabled:cursor-not-allowed"
                        >
                          Confirmar presença
                        </button>
                      )}
                    </div>
                    {!status.jaConfirmado && status.textoAjuda && (
                      <p className="text-[11px] text-navy/35 mt-2 text-right">
                        {status.textoAjuda}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <p className="text-[14.5px] font-semibold text-navy mb-0.5">Meus Comprovantes</p>
          <p className="text-xs text-navy/40 mb-3.5">Acesse e apresente no dia da visita</p>
          <button
            onClick={() => navigate('/comprovantes')}
            className="w-full border border-navy/15 rounded-lg py-3 text-[13.5px] font-medium text-navy hover:bg-navy/[0.02] transition"
          >
            Acessar meus comprovantes
          </button>
        </main>
      </div>

      {paraCancelar && (
        <div className="fixed inset-0 bg-navy/40 flex items-center justify-center px-4 z-30">
          <div className="w-full max-w-[380px] bg-white rounded-[20px] p-6">
            <h3 className="text-base font-semibold text-navy">Cancelar inscrição?</h3>
            <p className="text-sm text-navy/55 mt-2">
              Tem certeza que deseja cancelar a visita de{' '}
              <strong className="text-navy">{paraCancelar.nomeCompleto}</strong> em{' '}
              <strong className="text-navy">
                {formatDataLonga(new Date(paraCancelar.visitaId + 'T00:00:00'))}
              </strong>{' '}
              às <strong className="text-navy">{paraCancelar.horario}</strong>? Essa ação não
              pode ser desfeita.
            </p>
            <div className="flex items-center gap-2 mt-5">
              <button
                onClick={() => setParaCancelar(null)}
                disabled={processando}
                className="flex-1 border border-navy/15 rounded-lg py-2.5 text-sm font-medium text-navy/60 hover:bg-navy/[0.02] transition"
              >
                Voltar
              </button>
              <button
                onClick={confirmarCancelamento}
                disabled={processando}
                className="flex-1 bg-red-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-red-600 transition disabled:opacity-60"
              >
                {processando ? 'Cancelando...' : 'Sim, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
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
    <div className="min-h-screen bg-navy-50 pb-20">
      <header className="flex items-center justify-between px-5 py-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-navy-800 flex items-center justify-center">
            <span className="text-lime-400 font-bold text-xs">CCG</span>
          </div>
          <span className="text-sm font-medium text-navy-700">
            {user?.displayName ?? user?.email}
          </span>
        </div>
        <button
          onClick={handleSair}
          className="text-sm text-navy-400 hover:text-navy-700 transition"
        >
          Sair
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-5">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">
            Minhas inscrições
          </h1>
        </div>

        {carregando ? (
          <p className="text-sm text-navy-300">Carregando...</p>
        ) : inscricoes.length === 0 ? (
          <p className="text-sm text-navy-300">
            Você ainda não tem inscrições em visitas.
          </p>
        ) : (
          <div className="space-y-3">
            {inscricoes.map((inscricao) => {
              const status = statusConfirmacao(inscricao)
              return (
                <div
                  key={inscricao.id}
                  className="bg-white rounded-2xl border border-navy-100 p-5 shadow-sm"
                >
                  <p className="text-base font-semibold text-navy-900">
                    {formatDataLonga(new Date(inscricao.visitaId + 'T00:00:00'))}
                  </p>
                  <p className="text-sm text-navy-500 mt-0.5">
                    {inscricao.horario} · {inscricao.nomeCompleto}
                  </p>

                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => setParaCancelar(inscricao)}
                      className="flex-1 rounded-lg border border-navy-200 text-sm font-medium text-navy-600 py-2 hover:border-red-300 hover:text-red-500 transition"
                    >
                      Cancelar visita
                    </button>

                    {status.jaConfirmado ? (
                      <span className="flex-1 text-center rounded-lg bg-navy-50 text-sm font-medium text-navy-500 py-2">
                        Presença confirmada
                      </span>
                    ) : (
                      <button
                        onClick={() => confirmarPresenca(inscricao)}
                        disabled={!status.podeConfirmar || processando}
                        title={status.textoAjuda || ''}
                        className="flex-1 rounded-lg bg-navy-800 text-white text-sm font-medium py-2 hover:bg-navy-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Confirmar presença
                      </button>
                    )}
                  </div>
                  {!status.jaConfirmado && status.textoAjuda && (
                    <p className="text-xs text-navy-300 mt-2 text-right">
                      {status.textoAjuda}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <section className="mt-9">
          <h2 className="text-lg font-semibold text-navy-900">Meus Comprovantes</h2>
          <p className="text-sm text-navy-400 mb-4">
            Acesse e apresente seu comprovante no dia da visita
          </p>
          <button
            onClick={() => navigate('/comprovantes')}
            className="w-full rounded-lg border border-navy-200 bg-white text-sm font-medium text-navy-700 py-2.5 hover:bg-navy-50 transition"
          >
            Acessar meus comprovantes
          </button>
        </section>
      </main>

      {paraCancelar && (
        <div className="fixed inset-0 bg-navy-900/40 flex items-center justify-center px-4 z-30">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-base font-semibold text-navy-900">
              Cancelar inscrição?
            </h3>
            <p className="text-sm text-navy-500 mt-2">
              Tem certeza que deseja cancelar a visita de{' '}
              <strong>{paraCancelar.nomeCompleto}</strong> em{' '}
              <strong>
                {formatDataLonga(new Date(paraCancelar.visitaId + 'T00:00:00'))}
              </strong>{' '}
              às <strong>{paraCancelar.horario}</strong>? Essa ação não pode ser desfeita.
            </p>
            <div className="flex items-center gap-2 mt-5">
              <button
                onClick={() => setParaCancelar(null)}
                disabled={processando}
                className="flex-1 rounded-lg border border-navy-200 text-sm font-medium text-navy-600 py-2.5 hover:bg-navy-50 transition"
              >
                Voltar
              </button>
              <button
                onClick={confirmarCancelamento}
                disabled={processando}
                className="flex-1 rounded-lg bg-red-500 text-white text-sm font-medium py-2.5 hover:bg-red-600 transition disabled:opacity-60"
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
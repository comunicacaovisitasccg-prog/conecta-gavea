import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collectionGroup, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import ComprovanteCard from '../components/ComprovanteCard'

function extrairVisitaId(refPath) {
  const partes = refPath.split('/')
  return partes[partes.length - 3]
}

export default function Comprovantes() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [comprovantes, setComprovantes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [baixando, setBaixando] = useState(null)
  const refs = useRef(new Map())

  useEffect(() => {
    async function carregar() {
      if (!user) return
      setCarregando(true)
      try {
        const q = query(collectionGroup(db, 'inscricoes'), where('uid', '==', user.uid))
        const snap = await getDocs(q)
        const lista = snap.docs
          .map((d) => ({
            id: d.id,
            visitaId: extrairVisitaId(d.ref.path),
            ...d.data(),
          }))
          .filter((i) => !i.cancelada)
          .sort((a, b) => a.visitaId.localeCompare(b.visitaId))
        setComprovantes(lista)
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [user])

  async function baixarComprovante(inscricao) {
    const elemento = refs.current.get(inscricao.id)
    if (!elemento) return

    setBaixando(inscricao.id)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(elemento, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      })

      const link = document.createElement('a')
      link.download = `comprovante-${inscricao.nomeCompleto.replace(/\s+/g, '-').toLowerCase()}-${inscricao.visitaId}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      setBaixando(null)
    }
  }

  return (
    <div className="min-h-screen bg-navy-50 px-4 py-10">
      <div className="w-full max-w-sm mx-auto">
        <button
          onClick={() => navigate('/minhas-inscricoes')}
          className="text-sm text-navy-400 hover:text-navy-700 transition mb-5"
        >
          ← Voltar
        </button>

        <div className="mb-6">
          <h1 className="text-xl font-semibold text-navy-900">Meus Comprovantes</h1>
          <p className="text-sm text-navy-400 mt-1">
            Apresente o comprovante no dia da visita
          </p>
        </div>

        {carregando ? (
          <p className="text-sm text-navy-300">Carregando...</p>
        ) : comprovantes.length === 0 ? (
          <p className="text-sm text-navy-300">
            Você ainda não tem inscrições em visitas.
          </p>
        ) : (
          <div className="space-y-6">
            {comprovantes.map((inscricao) => (
              <div key={inscricao.id}>
                <ComprovanteCard
                  ref={(el) => {
                    if (el) refs.current.set(inscricao.id, el)
                  }}
                  inscricao={inscricao}
                />
                <button
                  onClick={() => baixarComprovante(inscricao)}
                  disabled={baixando === inscricao.id}
                  className="w-full mt-3 rounded-lg bg-navy-800 text-white text-sm font-medium py-2.5 hover:bg-navy-700 transition disabled:opacity-60"
                >
                  {baixando === inscricao.id ? 'Gerando...' : 'Baixar comprovante'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
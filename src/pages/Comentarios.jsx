import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import { db } from '../firebase'

function iniciais(nome, sobrenome) {
  return `${(nome || '?')[0]}${(sobrenome || '')[0] || ''}`.toUpperCase()
}

function formatDataCurta(dataISO) {
  const [ano, mes, dia] = dataISO.split('-')
  return `${dia}/${mes}/${ano}`
}

export default function Comentarios() {
  const navigate = useNavigate()
  const [comentarios, setComentarios] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function carregar() {
      try {
        const snap = await getDocs(
          query(
            collection(db, 'comentarios'),
            where('aprovado', '==', true),
            orderBy('dataVisita', 'desc')
          )
        )
        setComentarios(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [])

  return (
    <div className="min-h-screen bg-cream px-4 py-9">
      <div className="w-full max-w-[380px] mx-auto">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-navy mb-6"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="#12213a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Voltar
        </button>

        <h1 className="text-[19px] font-semibold text-navy mb-1">Comentários da visita</h1>
        <p className="text-[13px] text-navy/45 mb-6">O que nossos visitantes acharam da experiência</p>

        {carregando ? (
          <p className="text-sm text-navy/35">Carregando...</p>
        ) : comentarios.length === 0 ? (
          <p className="text-sm text-navy/35">Ainda não há comentários publicados.</p>
        ) : (
          <div className="bg-white border border-navy/[0.08] rounded-[20px] p-5 divide-y divide-navy/[0.07]">
            {comentarios.map((c) => (
              <div key={c.id} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-mint text-green text-xs font-bold flex items-center justify-center shrink-0">
                    {iniciais(c.nome, c.sobrenome)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm">
                        <span className="font-semibold text-navy">{c.nome}</span>{' '}
                        <span className="text-navy/60">{c.sobrenome}</span>
                      </p>
                      <span className="text-[11px] text-navy/35 shrink-0">
                        {formatDataCurta(c.dataVisita)}
                      </span>
                    </div>
                    <p className="text-[13px] text-navy/65 leading-snug mt-0.5">{c.comentario}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => navigate('/comentar')}
          className="w-full border border-navy/15 rounded-lg py-3 text-[13.5px] font-medium text-navy hover:bg-navy/[0.02] transition mt-6"
        >
          Deixar meu comentário
        </button>
      </div>
    </div>
  )
}

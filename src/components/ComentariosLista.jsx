import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { db } from '../firebase'

const QUANTIDADE_NA_HOME = 3

function iniciais(nome, sobrenome) {
  return `${(nome || '?')[0]}${(sobrenome || '')[0] || ''}`.toUpperCase()
}

function formatDataCurta(dataISO) {
  const [ano, mes, dia] = dataISO.split('-')
  return `${dia}/${mes}/${ano}`
}

export default function ComentariosLista() {
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
            orderBy('dataVisita', 'desc'),
            limit(QUANTIDADE_NA_HOME)
          )
        )
        setComentarios(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      } catch {
        setComentarios([])
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [])

  if (!carregando && comentarios.length === 0) return null

  return (
    <div className="bg-white border border-navy/[0.08] rounded-[20px] p-5 mb-7">
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-8 h-8 rounded-full bg-mint flex items-center justify-center shrink-0">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6f8a3f" strokeWidth="1.8">
            <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-[15px] font-bold text-navy">Comentários da visita</h2>
      </div>
      <p className="text-[12.5px] text-navy/50 mb-4">O que nossos visitantes acharam da experiência</p>

      {carregando ? (
        <p className="text-sm text-navy/35">Carregando...</p>
      ) : (
        <div className="divide-y divide-navy/[0.07]">
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
        onClick={() => navigate('/comentarios')}
        className="w-full text-center text-[13px] font-semibold text-green mt-4 flex items-center justify-center gap-1"
      >
        Ver todos os comentários
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M9 6l6 6-6 6" stroke="#6f8a3f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
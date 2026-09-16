import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

function hojeISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function Comentar() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [nome, setNome] = useState('')
  const [sobrenome, setSobrenome] = useState('')
  const [comentario, setComentario] = useState('')
  const [dataVisita, setDataVisita] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    if (!nome.trim() || !sobrenome.trim() || !comentario.trim() || !dataVisita) {
      setErro('Preencha todos os campos antes de enviar.')
      return
    }
    if (dataVisita > hojeISO()) {
      setErro('A data da visita não pode ser no futuro.')
      return
    }

    setEnviando(true)
    try {
      await addDoc(collection(db, 'comentarios'), {
        nome: nome.trim(),
        sobrenome: sobrenome.trim(),
        comentario: comentario.trim(),
        dataVisita,
        aprovado: false,
        sincronizadoPlanilha: false,
        uid: user?.uid ?? null,
        criadoEm: new Date().toISOString(),
      })
      setEnviado(true)
    } catch {
      setErro('Não foi possível enviar o comentário. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream px-4">
        <div className="w-full max-w-[380px] bg-white border border-navy/[0.08] rounded-[20px] p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-navy flex items-center justify-center mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8bc53f" strokeWidth="2">
              <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-navy">Comentário enviado!</h1>
          <p className="text-sm text-navy/55 mt-2">
            Obrigado por compartilhar sua experiência. Ele passa por uma revisão antes de
            aparecer no app.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-navy text-white rounded-lg py-[13px] text-sm font-medium mt-6 hover:opacity-90 transition"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream px-4 py-9">
      <div className="w-full max-w-[380px] mx-auto bg-white border border-navy/[0.08] rounded-[20px] px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-navy mb-6"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 6l-6 6 6 6"
              stroke="#12213a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Voltar
        </button>

        <h1 className="text-[19px] font-semibold text-navy tracking-tight mb-1">
          Deixe seu comentário
        </h1>
        <p className="text-[13px] text-navy/45 mb-7">Conte como foi a sua visita à obra</p>

        <form onSubmit={handleSubmit} noValidate>
          <label className="block text-xs text-navy/50 mb-1.5">Nome</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
            className="w-full bg-transparent border-0 border-b border-navy/15 py-2 text-[14.5px] text-navy placeholder:text-navy/35 outline-none focus:border-navy/40 transition mb-5"
          />

          <label className="block text-xs text-navy/50 mb-1.5">Sobrenome</label>
          <input
            type="text"
            value={sobrenome}
            onChange={(e) => setSobrenome(e.target.value)}
            placeholder="Seu sobrenome"
            className="w-full bg-transparent border-0 border-b border-navy/15 py-2 text-[14.5px] text-navy placeholder:text-navy/35 outline-none focus:border-navy/40 transition mb-5"
          />

          <label className="block text-xs text-navy/50 mb-1.5">Data da visita</label>
          <input
            type="date"
            value={dataVisita}
            max={hojeISO()}
            onChange={(e) => setDataVisita(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-navy/15 py-2 text-[14.5px] text-navy outline-none focus:border-navy/40 transition mb-5"
          />

          <label className="block text-xs text-navy/50 mb-1.5">Comentário</label>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Como foi sua experiência na visita?"
            rows={4}
            className="w-full bg-transparent border-0 border-b border-navy/15 py-2 text-[14.5px] text-navy placeholder:text-navy/35 outline-none focus:border-navy/40 transition mb-5 resize-none"
          />

          {erro && <p className="text-sm text-red-500 font-medium mb-4">{erro}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-navy text-white rounded-lg py-[13px] text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
          >
            {enviando ? 'Enviando...' : 'Enviar comentário'}
          </button>

          <p className="text-[11px] text-navy/35 text-center mt-4">
            Seu comentário passa por uma revisão antes de aparecer para outras pessoas.
          </p>
        </form>
      </div>
    </div>
  )
}

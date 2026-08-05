import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { collection, doc, getDoc, runTransaction } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { formatDataLonga, isValidCPF, maskCPF, maskPhone } from '../lib/validators'

const OPCOES_COMO_SOUBE = [
  'Redes sociais',
  'Indicação de amigo ou familiar',
  'Site da CCG',
  'Imprensa',
  'Outro',
]

export default function Inscricao() {
  const { visitaId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [visita, setVisita] = useState(null)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cpf, setCpf] = useState('')
  const [comoSoube, setComoSoube] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [confirmado, setConfirmado] = useState(null)

  useEffect(() => {
    async function carregar() {
      const snap = await getDoc(doc(db, 'visitas', visitaId))
      if (snap.exists()) setVisita({ id: snap.id, ...snap.data() })
    }
    carregar()
  }, [visitaId])

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    if (!isValidCPF(cpf)) {
      setErro('CPF inválido.')
      return
    }
    if (!comoSoube) {
      setErro('Selecione como soube da visita.')
      return
    }

    setEnviando(true)
    try {
      const horarioEscolhido = await runTransaction(db, async (tx) => {
        const visitaRef = doc(db, 'visitas', visitaId)
        const visitaSnap = await tx.get(visitaRef)
        if (!visitaSnap.exists()) throw new Error('Visita não encontrada.')

        const v = visitaSnap.data()
        const capacidade = v.capacidadePorHorario ?? 22
        const ocupadas08 = v.vagas08Ocupadas ?? 0
        const ocupadas10 = v.vagas10Ocupadas ?? 0

        let horario
        if (ocupadas08 < capacidade) {
          horario = '08h30'
          tx.update(visitaRef, { vagas08Ocupadas: ocupadas08 + 1 })
        } else if (ocupadas10 < capacidade) {
          horario = '10h00'
          tx.update(visitaRef, { vagas10Ocupadas: ocupadas10 + 1 })
        } else {
          throw new Error('Esta visita não possui mais vagas disponíveis.')
        }

        const inscricoesRef = collection(db, 'visitas', visitaId, 'inscricoes')
        const inscricaoRef = doc(
          inscricoesRef,
          `${user?.uid ?? 'anon'}_${Date.now()}`
        )
        tx.set(inscricaoRef, {
          nomeCompleto: nome,
          telefone,
          cpf: cpf.replace(/\D/g, ''),
          comoSoube,
          horario,
          uid: user?.uid ?? null,
          criadoEm: new Date().toISOString(),
        })

        return horario
      })

      setConfirmado(horarioEscolhido)
    } catch (err) {
      setErro(err.message || 'Não foi possível concluir a inscrição.')
    } finally {
      setEnviando(false)
    }
  }

  if (confirmado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-50 px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-navy-100 p-6 text-center shadow-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-navy-800 flex items-center justify-center mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c8e84a" strokeWidth="2">
              <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-navy-900">Inscrição confirmada</h1>
          <p className="text-sm text-navy-500 mt-2">
            Sua visita foi marcada para{' '}
            <strong>{visita && formatDataLonga(new Date(visita.data + 'T00:00:00'))}</strong>{' '}
            às <strong>{confirmado}</strong>.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full mt-6 rounded-lg bg-navy-800 text-white text-sm font-medium py-2.5 hover:bg-navy-700 transition"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-50 px-4 py-10">
      <div className="w-full max-w-sm mx-auto">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-navy-400 hover:text-navy-700 transition mb-5"
        >
          ← Voltar
        </button>

        <div className="mb-6">
          <h1 className="text-xl font-semibold text-navy-900">Inscrever-se na visita</h1>
          <p className="text-sm text-navy-400 mt-1">
            {visita
              ? formatDataLonga(new Date(visita.data + 'T00:00:00'))
              : 'Carregando...'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-navy-100 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Nome completo
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-300 outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Telefone
              </label>
              <input
                type="tel"
                required
                value={telefone}
                onChange={(e) => setTelefone(maskPhone(e.target.value))}
                placeholder="(21) 90000-0000"
                className="w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-300 outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">CPF</label>
              <input
                type="text"
                required
                value={cpf}
                onChange={(e) => setCpf(maskCPF(e.target.value))}
                placeholder="000.000.000-00"
                className="w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-300 outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Como soube da visita?
              </label>
              <select
                required
                value={comoSoube}
                onChange={(e) => setComoSoube(e.target.value)}
                className="w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500 transition"
              >
                <option value="" disabled>
                  Selecione uma opção
                </option>
                {OPCOES_COMO_SOUBE.map((opcao) => (
                  <option key={opcao} value={opcao}>
                    {opcao}
                  </option>
                ))}
              </select>
            </div>

            {erro && <p className="text-sm text-red-600">{erro}</p>}

            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-lg bg-navy-800 text-white text-sm font-medium py-2.5 hover:bg-navy-700 transition disabled:opacity-60"
            >
              {enviando ? 'Confirmando...' : 'Confirmar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

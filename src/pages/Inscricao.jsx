import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { collection, doc, getDoc, runTransaction } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { formatDataLonga, isValidCPF, maskCPF, maskPhone } from '../lib/validators'
import { OPCOES_COMO_SOUBE } from '../lib/comoSoube'

const MAX_PARTICIPANTES = 3

function participanteVazio() {
  return {
    nomeCompleto: '',
    telefone: '',
    cpf: '',
    comoSoube: '',
    comoSoubeDetalhe: '',
  }
}

function opcaoSelecionada(comoSoube) {
  return OPCOES_COMO_SOUBE.find((o) => o.valor === comoSoube)
}

// Retorna a mensagem de erro de um campo específico, ou null se estiver ok
function erroDoCampo(p, campo) {
  switch (campo) {
    case 'nomeCompleto':
      return p.nomeCompleto.trim() ? null : 'Preencha o nome completo'
    case 'telefone':
      return p.telefone.trim() ? null : 'Preencha o telefone'
    case 'cpf':
      if (!p.cpf.trim()) return 'Preencha o CPF'
      return isValidCPF(p.cpf) ? null : 'CPF inválido'
    case 'comoSoube':
      return p.comoSoube ? null : 'Selecione uma opção'
    case 'comoSoubeDetalhe': {
      const opcao = opcaoSelecionada(p.comoSoube)
      if (!opcao?.precisaDetalhe) return null
      return p.comoSoubeDetalhe.trim()
        ? null
        : `Preencha: ${opcao.labelDetalhe.toLowerCase()}`
    }
    default:
      return null
  }
}

function participanteValido(p) {
  return ['nomeCompleto', 'telefone', 'cpf', 'comoSoube', 'comoSoubeDetalhe'].every(
    (campo) => erroDoCampo(p, campo) === null
  )
}

export default function Inscricao() {
  const { visitaId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [visita, setVisita] = useState(null)
  const [participantes, setParticipantes] = useState([participanteVazio()])
  const [erroGeral, setErroGeral] = useState('')
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [confirmado, setConfirmado] = useState(null)

  useEffect(() => {
    async function carregar() {
      const snap = await getDoc(doc(db, 'visitas', visitaId))
      if (snap.exists()) setVisita({ id: snap.id, ...snap.data() })
    }
    carregar()
  }, [visitaId])

  function atualizarParticipante(index, campo, valor) {
    setParticipantes((atual) =>
      atual.map((p, i) => {
        if (i !== index) return p
        const novo = { ...p, [campo]: valor }
        if (campo === 'comoSoube') novo.comoSoubeDetalhe = ''
        return novo
      })
    )
  }

  function adicionarParticipante() {
    if (participantes.length >= MAX_PARTICIPANTES) return
    setParticipantes((atual) => [...atual, participanteVazio()])
  }

  function removerParticipante(index) {
    setParticipantes((atual) => atual.filter((_, i) => i !== index))
  }

  const todosValidos = participantes.every(participanteValido)

  async function handleSubmit(e) {
    e.preventDefault()
    setErroGeral('')
    setTentouEnviar(true)

    if (!todosValidos) {
      setErroGeral('Preencha todos os campos destacados antes de confirmar.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setEnviando(true)
    try {
      const necessarias = participantes.length

      const horarioEscolhido = await runTransaction(db, async (tx) => {
        const visitaRef = doc(db, 'visitas', visitaId)
        const visitaSnap = await tx.get(visitaRef)
        if (!visitaSnap.exists()) throw new Error('Visita não encontrada.')

        const v = visitaSnap.data()
        const capacidade = v.capacidadePorHorario ?? 22
        const ocupadas08 = v.vagas08Ocupadas ?? 0
        const ocupadas10 = v.vagas10Ocupadas ?? 0

        let horario
        if (capacidade - ocupadas08 >= necessarias) {
          horario = '08h30'
          tx.update(visitaRef, { vagas08Ocupadas: ocupadas08 + necessarias })
        } else if (capacidade - ocupadas10 >= necessarias) {
          horario = '10h00'
          tx.update(visitaRef, { vagas10Ocupadas: ocupadas10 + necessarias })
        } else {
          throw new Error(
            'Não há vagas suficientes num mesmo horário para todo o grupo.'
          )
        }

        const grupoId = `${user?.uid ?? 'anon'}_${Date.now()}`
        const inscricoesRef = collection(db, 'visitas', visitaId, 'inscricoes')

        participantes.forEach((p, i) => {
          const inscricaoRef = doc(inscricoesRef, `${grupoId}_${i}`)
          tx.set(inscricaoRef, {
            grupoId,
            nomeCompleto: p.nomeCompleto,
            telefone: p.telefone,
            cpf: p.cpf.replace(/\D/g, ''),
            comoSoube: p.comoSoube,
            comoSoubeDetalhe: p.comoSoubeDetalhe || null,
            horario,
            uid: user?.uid ?? null,
            criadoEm: new Date().toISOString(),
            sincronizadoPlanilha: false,
            cancelada: false,
            confirmadoPresenca: false,
          })
        })

        return horario
      })

      setConfirmado(horarioEscolhido)
    } catch (err) {
      setErroGeral(err.message || 'Não foi possível concluir a inscrição.')
    } finally {
      setEnviando(false)
    }
  }

  if (confirmado) {
    const plural = participantes.length > 1
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-50 px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-navy-100 p-6 text-center shadow-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-navy-800 flex items-center justify-center mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c8e84a" strokeWidth="2">
              <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-navy-900">
            {plural ? 'Inscrições confirmadas' : 'Inscrição confirmada'}
          </h1>
          <p className="text-sm text-navy-500 mt-2">
            {plural
              ? `A inscrição das ${participantes.length} pessoas foi confirmada para`
              : 'Sua visita foi confirmada para'}{' '}
            <strong>{visita && formatDataLonga(new Date(visita.data + 'T00:00:00'))}</strong>{' '}
            às <strong>{confirmado}</strong>.
          </p>
          <p className="text-sm text-navy-500 mt-3">
            Confira {plural ? 'os comprovantes' : 'o comprovante'} na aba{' '}
            <strong>Meus comprovantes</strong> — {plural ? 'eles vão' : 'ele vai'} precisar
            ser apresentado{plural ? 's' : ''} no dia da visita.
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

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {participantes.map((p, index) => {
            const opcao = opcaoSelecionada(p.comoSoube)
            const erros = tentouEnviar
              ? {
                  nomeCompleto: erroDoCampo(p, 'nomeCompleto'),
                  telefone: erroDoCampo(p, 'telefone'),
                  cpf: erroDoCampo(p, 'cpf'),
                  comoSoube: erroDoCampo(p, 'comoSoube'),
                  comoSoubeDetalhe: erroDoCampo(p, 'comoSoubeDetalhe'),
                }
              : {}

            const classeInput = (temErro) =>
              `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-300 outline-none focus:ring-1 transition ${
                temErro
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-400'
                  : 'border-navy-200 focus:border-navy-500 focus:ring-navy-500'
              }`

            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-navy-100 p-6 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-navy-800">
                    {index === 0 ? 'Seus dados' : `Participante ${index + 1}`}
                  </h2>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removerParticipante(index)}
                      className="text-xs text-navy-400 hover:text-red-500 transition"
                    >
                      Remover
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    value={p.nomeCompleto}
                    onChange={(e) =>
                      atualizarParticipante(index, 'nomeCompleto', e.target.value)
                    }
                    placeholder="Nome completo"
                    className={classeInput(erros.nomeCompleto)}
                  />
                  {erros.nomeCompleto && (
                    <p className="text-xs text-red-500 mt-1">{erros.nomeCompleto}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={p.telefone}
                    onChange={(e) =>
                      atualizarParticipante(index, 'telefone', maskPhone(e.target.value))
                    }
                    placeholder="(21) 90000-0000"
                    className={classeInput(erros.telefone)}
                  />
                  {erros.telefone && (
                    <p className="text-xs text-red-500 mt-1">{erros.telefone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">CPF</label>
                  <input
                    type="text"
                    value={p.cpf}
                    onChange={(e) =>
                      atualizarParticipante(index, 'cpf', maskCPF(e.target.value))
                    }
                    placeholder="000.000.000-00"
                    className={classeInput(erros.cpf)}
                  />
                  {erros.cpf && <p className="text-xs text-red-500 mt-1">{erros.cpf}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">
                    Como soube da visita?
                  </label>
                  <select
                    value={p.comoSoube}
                    onChange={(e) =>
                      atualizarParticipante(index, 'comoSoube', e.target.value)
                    }
                    className={classeInput(erros.comoSoube)}
                  >
                    <option value="" disabled>
                      Selecione uma opção
                    </option>
                    {OPCOES_COMO_SOUBE.map((o) => (
                      <option key={o.valor} value={o.valor}>
                        {o.valor}
                      </option>
                    ))}
                  </select>
                  {erros.comoSoube && (
                    <p className="text-xs text-red-500 mt-1">{erros.comoSoube}</p>
                  )}
                </div>

                {opcao?.precisaDetalhe && (
                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-1">
                      {opcao.labelDetalhe}
                    </label>
                    <input
                      type="text"
                      value={p.comoSoubeDetalhe}
                      onChange={(e) =>
                        atualizarParticipante(index, 'comoSoubeDetalhe', e.target.value)
                      }
                      placeholder={opcao.labelDetalhe}
                      className={classeInput(erros.comoSoubeDetalhe)}
                    />
                    {erros.comoSoubeDetalhe && (
                      <p className="text-xs text-red-500 mt-1">{erros.comoSoubeDetalhe}</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {participantes.length < MAX_PARTICIPANTES && (
            <button
              type="button"
              onClick={adicionarParticipante}
              className="w-full rounded-lg border border-dashed border-navy-300 text-sm font-medium text-navy-600 py-2.5 hover:border-navy-500 hover:text-navy-800 transition"
            >
              + Adicionar participante
            </button>
          )}

          {erroGeral && <p className="text-sm text-red-600 font-medium">{erroGeral}</p>}

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
  )
}
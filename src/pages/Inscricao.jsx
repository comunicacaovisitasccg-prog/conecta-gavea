import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { collection, doc, getDoc, getDocs, query, runTransaction, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { formatDataLonga, isValidCPF, maskCPF, maskPhone } from '../lib/validators'
import { OPCOES_COMO_SOUBE } from '../lib/comoSoube'

const MAX_PARTICIPANTES = 3
const MASCOTE_URL = '/images/mascote-capivara-crop.png'

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

      if (user?.uid) {
        const existentesSnap = await getDocs(
          query(collection(db, 'visitas', visitaId, 'inscricoes'), where('uid', '==', user.uid))
        )
        const existentesAtivas = existentesSnap.docs.filter((d) => !d.data().cancelada).length
        if (existentesAtivas + necessarias > MAX_PARTICIPANTES) {
          throw new Error(
            existentesAtivas > 0
              ? `Você já tem ${existentesAtivas} inscrição(ões) nesta data. O limite é de ${MAX_PARTICIPANTES} pessoas (você + 2) por data.`
              : `Esse grupo tem mais pessoas do que o limite permitido (${MAX_PARTICIPANTES} por data).`
          )
        }
      }

      for (const p of participantes) {
        const cpfDigitos = p.cpf.replace(/\D/g, '')
        const bloqueioSnap = await getDoc(doc(db, 'bloqueiosCpf', cpfDigitos))
        if (bloqueioSnap.exists()) {
          const bloqueadas = bloqueioSnap.data().visitasBloqueadas || []
          const estaBloqueado = bloqueadas.some((b) => b.visitaId === visitaId)
          if (estaBloqueado) {
            const maiorData = bloqueadas.reduce(
              (maior, b) => (b.data > maior ? b.data : maior),
              ''
            )
            const dataLiberacao = maiorData
              ? ` Poderá se inscrever novamente em visitas após ${formatDataLonga(
                  new Date(maiorData + 'T00:00:00')
                )}.`
              : ''
            throw new Error(
              `${p.nomeCompleto || 'Um dos participantes'} não pode se inscrever nesta data por causa de um cancelamento recente.${dataLiberacao}`
            )
          }
        }
      }

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
      <div className="min-h-screen flex items-center justify-center bg-cream px-4">
        <div className="w-full max-w-[380px] bg-white border border-navy/[0.08] rounded-[20px] p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-navy flex items-center justify-center mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8bc53f" strokeWidth="2">
              <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-navy">
            {plural ? 'Inscrições confirmadas' : 'Inscrição confirmada'}
          </h1>
          <p className="text-sm text-navy/55 mt-2">
            {plural
              ? `A inscrição das ${participantes.length} pessoas foi confirmada para`
              : 'Sua visita foi confirmada para'}{' '}
            <strong className="text-navy">
              {visita && formatDataLonga(new Date(visita.data + 'T00:00:00'))}
            </strong>{' '}
            às <strong className="text-navy">{confirmado}</strong>.
          </p>
          <p className="text-sm text-navy/55 mt-3">
            Acompanhe os detalhes na aba{' '}
            <strong className="text-navy">Minhas inscrições</strong>. Lá também fica{' '}
            {plural ? 'os comprovantes, que vão' : 'o comprovante, que vai'} precisar ser
            apresentado{plural ? 's' : ''} no dia da visita.
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
          onClick={() => navigate('/')}
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
          Inscrever-se na visita
        </h1>
        <p className="text-[13px] text-navy/45 mb-7">
          {visita
            ? formatDataLonga(new Date(visita.data + 'T00:00:00'))
            : 'Carregando...'}
        </p>

        <form onSubmit={handleSubmit} noValidate>
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
              `w-full bg-transparent border-0 border-b py-2 text-[14.5px] text-navy placeholder:text-navy/35 outline-none transition mb-5 ${
                temErro ? 'border-red-400' : 'border-navy/15 focus:border-navy/40'
              }`

            return (
              <div key={index} className={index > 0 ? 'mt-8' : ''}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] uppercase tracking-wide text-navy/40 font-semibold">
                    {index === 0 ? 'Seus dados' : `Participante ${index + 1}`}
                  </p>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removerParticipante(index)}
                      className="text-xs text-navy/40 hover:text-red-500 transition"
                    >
                      Remover
                    </button>
                  )}
                </div>

                <label className="block text-xs text-navy/50 mb-1.5">Nome completo</label>
                <input
                  type="text"
                  value={p.nomeCompleto}
                  onChange={(e) => atualizarParticipante(index, 'nomeCompleto', e.target.value)}
                  placeholder="Nome completo"
                  className={classeInput(erros.nomeCompleto)}
                />
                {erros.nomeCompleto && (
                  <p className="text-xs text-red-500 -mt-4 mb-4">{erros.nomeCompleto}</p>
                )}

                <label className="block text-xs text-navy/50 mb-1.5">Telefone</label>
                <input
                  type="tel"
                  value={p.telefone}
                  onChange={(e) => atualizarParticipante(index, 'telefone', maskPhone(e.target.value))}
                  placeholder="(21) 90000-0000"
                  className={classeInput(erros.telefone)}
                />
                {erros.telefone && (
                  <p className="text-xs text-red-500 -mt-4 mb-4">{erros.telefone}</p>
                )}

                <label className="block text-xs text-navy/50 mb-1.5">CPF</label>
                <input
                  type="text"
                  value={p.cpf}
                  onChange={(e) => atualizarParticipante(index, 'cpf', maskCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  className={classeInput(erros.cpf)}
                />
                {erros.cpf && <p className="text-xs text-red-500 -mt-4 mb-4">{erros.cpf}</p>}

                <label className="block text-xs text-navy/50 mb-1.5">Como soube da visita?</label>
                <select
                  value={p.comoSoube}
                  onChange={(e) => atualizarParticipante(index, 'comoSoube', e.target.value)}
                  className={`${classeInput(erros.comoSoube)} ${!p.comoSoube ? 'text-navy/50' : ''}`}
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
                  <p className="text-xs text-red-500 -mt-4 mb-4">{erros.comoSoube}</p>
                )}

                {opcao?.precisaDetalhe && (
                  <>
                    <label className="block text-xs text-navy/50 mb-1.5">
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
                      <p className="text-xs text-red-500 -mt-4 mb-4">{erros.comoSoubeDetalhe}</p>
                    )}
                  </>
                )}
              </div>
            )
          })}

          {participantes.length < MAX_PARTICIPANTES && (
            <div
              className="flex items-center gap-3 bg-mint rounded-xl px-3.5 py-3 mt-6 mb-3.5"
              style={{ border: '1px solid rgba(139,197,63,0.3)' }}
            >
              <div className="w-11 h-11 rounded-full bg-[#eef3e5] flex items-center justify-center overflow-hidden shrink-0">
                <img src={MASCOTE_URL} alt="Mascote" className="w-[85%] h-[85%] object-contain" />
              </div>
              <p className="text-xs text-navy/70 leading-snug">
                Que tal chamar um amigo ou familiar para essa aventura? Adicione os
                participantes abaixo.
              </p>
            </div>
          )}

          {participantes.length < MAX_PARTICIPANTES && (
            <button
              type="button"
              onClick={adicionarParticipante}
              className="w-full border border-navy/15 rounded-lg py-3 text-[13.5px] font-medium text-navy/50 hover:text-navy/70 hover:border-navy/25 transition mt-2 mb-3.5"
            >
              + Adicionar participante
            </button>
          )}

          {erroGeral && <p className="text-sm text-red-500 font-medium mb-4">{erroGeral}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-navy text-white rounded-lg py-[13px] text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
          >
            {enviando ? 'Confirmando...' : 'Confirmar'}
          </button>
        </form>
      </div>
    </div>
  )
}
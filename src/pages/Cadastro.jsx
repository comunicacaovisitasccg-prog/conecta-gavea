import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import PasswordInput from '../components/PasswordInput'
import { validatePassword, maskPhone } from '../lib/validators'

const REGRAS_LABEL = {
  tamanho: 'Mínimo de 8 caracteres',
  maiuscula: 'Uma letra maiúscula',
  numero: 'Um número',
  especial: 'Um caractere especial',
}

export default function Cadastro() {
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const { valida, regras } = useMemo(() => validatePassword(senha), [senha])
  const senhasConferem = senha.length > 0 && senha === confirmarSenha

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    if (!valida) {
      setErro('A senha não atende a todos os requisitos.')
      return
    }
    if (!senhasConferem) {
      setErro('As senhas não são iguais.')
      return
    }

    setCarregando(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, senha)
      await updateProfile(cred.user, { displayName: nome })
      await setDoc(doc(db, 'usuarios', cred.user.uid), {
        nomeCompleto: nome,
        telefone,
        email,
        criadoEm: new Date().toISOString(),
      })
      navigate('/')
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setErro('Este e-mail já está cadastrado.')
      } else {
        setErro('Não foi possível concluir o cadastro. Tente novamente.')
      }
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-[380px] bg-white border border-navy/[0.08] rounded-[20px] px-8 py-10">
        <h1 className="text-[19px] font-semibold text-navy mb-0.5">Criar conta</h1>
        <p className="text-[13px] text-navy/45 mb-7">Conecta Gávea · Visitas guiadas</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="nome" className="block text-xs text-navy/50 mb-1.5">
            Nome completo
          </label>
          <input
            id="nome"
            type="text"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome completo"
            className="w-full bg-transparent border-0 border-b border-navy/15 py-2 text-[14.5px] text-navy placeholder:text-navy/35 outline-none focus:border-navy/40 transition mb-5"
          />

          <label htmlFor="telefone" className="block text-xs text-navy/50 mb-1.5">
            Telefone
          </label>
          <input
            id="telefone"
            type="tel"
            required
            value={telefone}
            onChange={(e) => setTelefone(maskPhone(e.target.value))}
            placeholder="(21) 90000-0000"
            className="w-full bg-transparent border-0 border-b border-navy/15 py-2 text-[14.5px] text-navy placeholder:text-navy/35 outline-none focus:border-navy/40 transition mb-5"
          />

          <label htmlFor="email" className="block text-xs text-navy/50 mb-1.5">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full bg-transparent border-0 border-b border-navy/15 py-2 text-[14.5px] text-navy placeholder:text-navy/35 outline-none focus:border-navy/40 transition mb-5"
          />

          <PasswordInput
            id="senha"
            label="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Crie uma senha"
          />

          {senha.length > 0 && (
            <ul className="grid grid-cols-2 gap-x-3 gap-y-1 mt-3 mb-2">
              {Object.entries(REGRAS_LABEL).map(([chave, texto]) => (
                <li
                  key={chave}
                  className={`text-xs flex items-center gap-1.5 ${
                    regras[chave] ? 'text-navy/70' : 'text-navy/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      regras[chave] ? 'bg-greenfill' : 'bg-navy/15'
                    }`}
                  />
                  {texto}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5">
            <PasswordInput
              id="confirmarSenha"
              label="Confirmar senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="Repita a senha"
            />
          </div>
          {confirmarSenha.length > 0 && !senhasConferem && (
            <p className="text-xs text-red-500 mt-1">As senhas não coincidem.</p>
          )}

          {erro && <p className="text-sm text-red-500 mt-4">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-navy text-white rounded-lg py-[13px] text-sm font-medium mt-7 hover:opacity-90 transition disabled:opacity-60"
          >
            {carregando ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="text-center text-[13px] text-navy/45 mt-6">
          Já tem conta?{' '}
          <Link to="/login" className="text-navy font-semibold">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}

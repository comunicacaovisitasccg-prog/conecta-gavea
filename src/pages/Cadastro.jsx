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
    <div className="min-h-screen flex items-center justify-center bg-navy-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-xl bg-navy-800 flex items-center justify-center mb-4">
            <span className="text-lime-400 font-bold text-lg tracking-tight">CCG</span>
          </div>
          <h1 className="text-xl font-semibold text-navy-900">Criar conta</h1>
          <p className="text-sm text-navy-400 mt-1">Conecta Gávea · Visitas guiadas</p>
        </div>

        <div className="bg-white rounded-2xl border border-navy-100 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-navy-700 mb-1">
                Nome completo
              </label>
              <input
                id="nome"
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-300 outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500 transition"
              />
            </div>

            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-navy-700 mb-1">
                Telefone
              </label>
              <input
                id="telefone"
                type="tel"
                required
                value={telefone}
                onChange={(e) => setTelefone(maskPhone(e.target.value))}
                placeholder="(21) 90000-0000"
                className="w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-300 outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500 transition"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-navy-700 mb-1">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-300 outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500 transition"
              />
            </div>

            <PasswordInput
              id="senha"
              label="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Crie uma senha"
            />

            {senha.length > 0 && (
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1 -mt-2">
                {Object.entries(REGRAS_LABEL).map(([chave, texto]) => (
                  <li
                    key={chave}
                    className={`text-xs flex items-center gap-1.5 ${
                      regras[chave] ? 'text-navy-600' : 'text-navy-300'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        regras[chave] ? 'bg-lime-500' : 'bg-navy-200'
                      }`}
                    />
                    {texto}
                  </li>
                ))}
              </ul>
            )}

            <PasswordInput
              id="confirmarSenha"
              label="Confirmar senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="Repita a senha"
            />
            {confirmarSenha.length > 0 && !senhasConferem && (
              <p className="text-xs text-red-500 -mt-2">As senhas não coincidem.</p>
            )}

            {erro && <p className="text-sm text-red-600">{erro}</p>}

            <button
              type="submit"
              disabled={carregando}
              className="w-full rounded-lg bg-navy-800 text-white text-sm font-medium py-2.5 hover:bg-navy-700 transition disabled:opacity-60"
            >
              {carregando ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-sm text-navy-400 mt-6">
            Já tem conta?{' '}
            <Link to="/login" className="text-navy-800 font-medium hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

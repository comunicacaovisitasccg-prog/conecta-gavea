import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase'
import PasswordInput from '../components/PasswordInput'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleEmailLogin(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      await signInWithEmailAndPassword(auth, email, senha)
      navigate('/')
    } catch {
      setErro('E-mail ou senha incorretos.')
    } finally {
      setCarregando(false)
    }
  }

  async function handleGoogleLogin() {
    setErro('')
    setCarregando(true)
    try {
      await signInWithPopup(auth, googleProvider)
      navigate('/')
    } catch {
      setErro('Não foi possível entrar com o Google. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-xl bg-navy-800 flex items-center justify-center mb-4">
            <span className="text-lime-400 font-bold text-lg tracking-tight">CCG</span>
          </div>
          <h1 className="text-xl font-semibold text-navy-900">Conecta Gávea</h1>
          <p className="text-sm text-navy-400 mt-1">Visitas guiadas · Estação Gávea</p>
        </div>

        <div className="bg-white rounded-2xl border border-navy-100 p-6 shadow-sm">
          <form onSubmit={handleEmailLogin} className="space-y-4">
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
              placeholder="Digite sua senha"
            />

            {erro && <p className="text-sm text-red-600">{erro}</p>}

            <button
              type="submit"
              disabled={carregando}
              className="w-full rounded-lg bg-navy-800 text-white text-sm font-medium py-2.5 hover:bg-navy-700 transition disabled:opacity-60"
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-navy-100" />
            <span className="text-xs text-navy-300">ou</span>
            <div className="h-px flex-1 bg-navy-100" />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={carregando}
            className="w-full flex items-center justify-center gap-2.5 rounded-lg border border-navy-200 bg-white text-sm font-medium text-navy-700 py-2.5 hover:bg-navy-50 transition disabled:opacity-60"
          >
            <svg width="17" height="17" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.52 12.27c0-.85-.07-1.48-.22-2.14H12v3.88h6.6c-.13 1.11-.85 2.78-2.45 3.9l-.02.15 3.56 2.76.25.02c2.27-2.1 3.58-5.18 3.58-8.57z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.79-2.94c-1.02.71-2.38 1.2-4.16 1.2-3.18 0-5.87-2.1-6.83-5H1.25v3.04C3.23 21.3 7.26 24 12 24z" />
              <path fill="#FBBC05" d="M5.17 14.36A7.24 7.24 0 0 1 4.77 12c0-.82.14-1.62.38-2.36V6.6H1.25A11.96 11.96 0 0 0 0 12c0 1.93.46 3.76 1.25 5.4l3.92-3.04z" />
              <path fill="#EA4335" d="M12 4.75c2.28 0 3.82.98 4.7 1.8l3.43-3.35C17.95 1.19 15.24 0 12 0 7.26 0 3.23 2.7 1.25 6.6l3.92 3.04c.96-2.9 3.65-4.89 6.83-4.89z" />
            </svg>
            Entrar com o Google
          </button>

          <p className="text-center text-sm text-navy-400 mt-6">
            Ainda não tem conta?{' '}
            <Link to="/cadastro" className="text-navy-800 font-medium hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'
import PasswordInput from '../components/PasswordInput'

const MASCOTE_URL = '/images/mascote-capivara-crop.png'

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
    <div className="min-h-screen flex items-center justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-[380px] bg-white border border-navy/[0.08] rounded-[20px] px-8 pt-[52px] pb-8">
        <div className="flex flex-col items-center">
          <div className="relative w-[110px] h-[110px] flex items-center justify-center mb-5">
            <div className="absolute inset-0 rounded-full border border-navy/[0.12]" />
            <div className="absolute inset-[7px] rounded-full bg-mint overflow-hidden flex items-center justify-center">
              <img
                src={MASCOTE_URL}
                alt="Mascote Conecta Gávea"
                className="w-[85%] h-[85%] object-contain"
              />
            </div>
          </div>

          <h1 className="text-[20px] font-poppins font-extrabold uppercase tracking-wide mb-0.5">
            <span className="text-navy">Conecta</span> <span className="text-green">Gávea</span>
          </h1>
          <p className="text-[12.5px] text-navy/45 mb-8 text-center">
            Comunicação · Consórcio Construtor Gávea
          </p>

          <form onSubmit={handleEmailLogin} className="w-full">
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
              placeholder="Digite sua senha"
            />

            {erro && <p className="text-sm text-red-500 mt-4">{erro}</p>}

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-navy text-white rounded-lg py-[13px] text-sm font-medium mt-7 hover:opacity-90 transition disabled:opacity-60"
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="flex items-center gap-3 w-full my-5">
            <div className="flex-1 h-px bg-navy/[0.08]" />
            <span className="text-[11px] text-navy/35">ou</span>
            <div className="flex-1 h-px bg-navy/[0.08]" />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={carregando}
            className="w-full bg-white border border-navy/[0.14] rounded-lg py-3 text-[13.5px] text-navy flex items-center justify-center gap-2.5 hover:bg-navy/[0.02] transition disabled:opacity-60"
          >
            <span className="w-4 h-4 rounded-full border-[1.2px] border-navy/30 flex items-center justify-center text-[10px] font-semibold text-navy/55">
              G
            </span>
            Entrar com o Google
          </button>

          <p className="text-[13px] text-navy/45 mt-6">
            Ainda não tem conta?{' '}
            <Link to="/cadastro" className="text-navy font-semibold">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

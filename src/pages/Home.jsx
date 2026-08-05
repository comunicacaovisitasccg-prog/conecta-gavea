import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import Carrossel from '../components/Carrossel'
import { formatDataLonga } from '../lib/validators'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [fotos, setFotos] = useState([])
  const [visitas, setVisitas] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function carregar() {
      try {
        const fotosSnap = await getDocs(
          query(collection(db, 'carrossel'), orderBy('ordem'))
        )
        setFotos(fotosSnap.docs.map((d) => d.data()))

        const hojeISO = new Date().toISOString().slice(0, 10)
        const visitasSnap = await getDocs(
          query(
            collection(db, 'visitas'),
            where('data', '>=', hojeISO),
            orderBy('data', 'asc')
          )
        )
        setVisitas(
          visitasSnap.docs.map((d) => {
            const v = d.data()
            const capacidade = v.capacidadePorHorario ?? 22
            const ocupadas08 = v.vagas08Ocupadas ?? 0
            const ocupadas10 = v.vagas10Ocupadas ?? 0
            const restantes = capacidade * 2 - (ocupadas08 + ocupadas10)
            return { id: d.id, ...v, restantes }
          })
        )
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [])

  async function handleSair() {
    await signOut(auth)
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-navy-50">
      <header className="flex items-center justify-between px-5 py-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-navy-800 flex items-center justify-center">
            <span className="text-lime-400 font-bold text-xs">CCG</span>
          </div>
          <span className="text-sm font-medium text-navy-700">
            {user?.displayName ?? user?.email}
          </span>
        </div>
        <button
          onClick={handleSair}
          className="text-sm text-navy-400 hover:text-navy-700 transition"
        >
          Sair
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-5 pb-16">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">
            Visita Guiada
          </h1>
          <p className="text-sm text-navy-400 mt-1">Estação Gávea · Linha 4</p>
        </div>

        <Carrossel fotos={fotos} />

        <section className="mt-9">
          <h2 className="text-lg font-semibold text-navy-900">Próximas visitas</h2>
          <p className="text-sm text-navy-400 mb-4">
            Clique na data para se inscrever
          </p>

          {carregando ? (
            <p className="text-sm text-navy-300">Carregando visitas...</p>
          ) : visitas.length === 0 ? (
            <p className="text-sm text-navy-300">
              Nenhuma visita programada no momento.
            </p>
          ) : (
            <div className="space-y-3">
              {visitas.map((visita) => {
                const lotada = visita.restantes <= 0
                return (
                  <button
                    key={visita.id}
                    disabled={lotada}
                    onClick={() => navigate(`/inscricao/${visita.id}`)}
                    className={`w-full text-left rounded-xl border p-4 transition ${
                      lotada
                        ? 'border-navy-100 bg-navy-50 opacity-60 cursor-not-allowed'
                        : 'border-navy-100 bg-white hover:border-navy-300 hover:shadow-sm'
                    }`}
                  >
                    <p className="text-base font-semibold text-navy-900">
                      {formatDataLonga(new Date(visita.data + 'T00:00:00'))}
                    </p>
                    <p className="text-xs text-navy-400 mt-1">
                      {lotada
                        ? 'Vagas esgotadas'
                        : `Restam ${visita.restantes} vagas`}
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

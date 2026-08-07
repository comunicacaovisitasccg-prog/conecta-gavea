import { useNavigate } from 'react-router-dom'

export default function Comprovantes() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-navy-50 px-4 py-10">
      <div className="w-full max-w-sm mx-auto">
        <button
          onClick={() => navigate('/minhas-inscricoes')}
          className="text-sm text-navy-400 hover:text-navy-700 transition mb-5"
        >
          ← Voltar
        </button>

        <div className="bg-white rounded-2xl border border-navy-100 p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-navy-900">Meus Comprovantes</h1>
          <p className="text-sm text-navy-500 mt-2">
            Essa tela ainda está em construção — em breve você vai poder ver e apresentar
            aqui o comprovante de cada visita confirmada.
          </p>
        </div>
      </div>
    </div>
  )
}
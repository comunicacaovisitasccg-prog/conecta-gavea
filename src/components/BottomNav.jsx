import { useLocation, useNavigate } from 'react-router-dom'

const ITENS = [
  {
    rota: '/',
    label: 'Início',
    icone: (ativo) => (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 11l9-8 9 8"
          stroke={ativo ? '#6f8a3f' : 'rgba(18,33,58,0.35)'}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 10v10h14V10"
          stroke={ativo ? '#6f8a3f' : 'rgba(18,33,58,0.35)'}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    rota: '/minhas-inscricoes',
    label: 'Minhas inscrições',
    icone: (ativo) => (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
        <rect
          x="3"
          y="7"
          width="18"
          height="11"
          rx="2"
          stroke={ativo ? '#6f8a3f' : 'rgba(18,33,58,0.35)'}
          strokeWidth="1.6"
        />
        <path
          d="M3 12h18"
          stroke={ativo ? '#6f8a3f' : 'rgba(18,33,58,0.35)'}
          strokeWidth="1.6"
        />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-navy/[0.07] z-20">
      <div className="max-w-2xl mx-auto flex">
        {ITENS.map((item) => {
          const ativo = location.pathname === item.rota
          return (
            <button
              key={item.rota}
              onClick={() => navigate(item.rota)}
              className="flex-1 flex flex-col items-center gap-1 pt-3 pb-4"
            >
              {item.icone(ativo)}
              <span
                className={`text-[10.5px] ${
                  ativo ? 'font-semibold text-green' : 'font-normal text-navy/40'
                }`}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

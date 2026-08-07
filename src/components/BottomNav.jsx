import { useLocation, useNavigate } from 'react-router-dom'

const ITENS = [
  {
    rota: '/',
    label: 'Início',
    icone: (ativo) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ativo ? '#0f2238' : '#7f9ec2'} strokeWidth="1.8">
        <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V19a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    rota: '/minhas-inscricoes',
    label: 'Minhas inscrições',
    icone: (ativo) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ativo ? '#0f2238' : '#7f9ec2'} strokeWidth="1.8">
        <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1.5a1.5 1.5 0 0 0 0 3V15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1.5a1.5 1.5 0 0 0 0-3V9Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 7v10" strokeDasharray="2 2" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-navy-100 z-20">
      <div className="max-w-2xl mx-auto flex">
        {ITENS.map((item) => {
          const ativo = location.pathname === item.rota
          return (
            <button
              key={item.rota}
              onClick={() => navigate(item.rota)}
              className="flex-1 flex flex-col items-center gap-1 py-2.5"
            >
              {item.icone(ativo)}
              <span
                className={`text-[11px] font-medium ${
                  ativo ? 'text-navy-900' : 'text-navy-400'
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
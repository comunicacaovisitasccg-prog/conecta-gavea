import { useNavigate } from 'react-router-dom'

export default function AvaliarVisitaCTA() {
  const navigate = useNavigate()

  return (
    <div className="flex items-center gap-3.5 border-t border-navy/[0.07] pt-5 mb-7">
      <div className="w-11 h-11 rounded-full border border-navy/15 flex items-center justify-center shrink-0">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#12213a" strokeWidth="1.6">
          <path
            d="M12 3.5l2.47 5.18 5.53.78-4 4.06.95 5.73L12 16.7l-4.95 2.55.95-5.73-4-4.06 5.53-.78L12 3.5z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-navy">Como foi sua visita?</p>
        <p className="text-xs text-navy/50 leading-snug">
          Sua opinião ajuda a melhorar as próximas experiências.
        </p>
      </div>
      <button
        onClick={() => navigate('/comentar')}
        className="bg-navy text-white text-xs font-semibold rounded-lg px-4 py-2.5 flex items-center gap-1.5 shrink-0 hover:opacity-90 transition"
      >
        Avaliar visita
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M9 6l6 6-6 6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
import { useEffect, useState } from 'react'

export default function Carrossel({ fotos, intervalo = 4000 }) {
  const [indice, setIndice] = useState(0)

  useEffect(() => {
    if (fotos.length <= 1) return
    const timer = setInterval(() => {
      setIndice((i) => (i + 1) % fotos.length)
    }, intervalo)
    return () => clearInterval(timer)
  }, [fotos.length, intervalo])

  if (fotos.length === 0) {
    return (
      <div className="w-full h-[150px] rounded-xl bg-navy/[0.05] flex items-center justify-center">
        <span className="text-xs text-navy/35">Nenhuma foto cadastrada</span>
      </div>
    )
  }

  return (
    <div className="relative w-full h-[150px] rounded-xl overflow-hidden bg-navy/[0.05]">
      {fotos.map((foto, i) => (
        <img
          key={foto.url ?? i}
          src={foto.url}
          alt={foto.legenda ?? 'Obra da Estação Gávea'}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            i === indice ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {fotos.length > 1 && (
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {fotos.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === indice ? 'w-5 bg-greenfill' : 'w-1.5 bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

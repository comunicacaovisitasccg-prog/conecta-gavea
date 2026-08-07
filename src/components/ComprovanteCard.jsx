import { forwardRef } from 'react'
import { formatDataLonga, maskCPF } from '../lib/validators'

const LOGO_URL = '/images/logo-ccg.png'

const NORMAS = [
  'Obrigatório o uso de calça comprida e camisa',
  'Calçado fechado ou bota (sem salto)',
  'O local pode estar escorregadio e com lama — escolha calçados adequados',
  'Proibido: vestido, saia, shorts, bermudas, camiseta regata, chinelos ou qualquer calçado aberto',
]

const ComprovanteCard = forwardRef(function ComprovanteCard({ inscricao }, ref) {
  return (
    <div ref={ref} className="bg-white border border-navy/[0.08] rounded-[20px] p-6 w-full">
      <div className="flex items-center justify-between border-b border-navy/[0.08] pb-4 mb-5">
        <img
          src={LOGO_URL}
          alt="Consórcio Construtor Gávea"
          className="h-8 w-auto object-contain"
        />
        <span className="text-xs font-semibold tracking-wide text-navy/40">
          CONECTA GÁVEA
        </span>
      </div>

      <h2 className="text-base font-semibold text-navy">Comprovante de Visita Guiada</h2>
      <p className="text-xs text-navy/45 mt-0.5">Obra do Metrô Gávea · Linha 4</p>

      <div className="grid grid-cols-2 gap-4 mt-5">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-navy/35">Nome</p>
          <p className="text-sm font-medium text-navy">{inscricao.nomeCompleto}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-navy/35">CPF</p>
          <p className="text-sm font-medium text-navy">{maskCPF(inscricao.cpf)}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-navy/35">Data</p>
          <p className="text-sm font-medium text-navy">
            {formatDataLonga(new Date(inscricao.visitaId + 'T00:00:00'))}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-navy/35">Horário de chegada</p>
          <p className="text-sm font-medium text-navy">{inscricao.horario}</p>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-[11px] uppercase tracking-wide text-navy/35">Ponto de encontro</p>
        <p className="text-sm text-navy/70 mt-0.5">
          Canteiro Administrativo da obra — Av. Padre Leonel Franca, nº 480
        </p>
      </div>

      <div className="mt-5">
        <p className="text-[11px] uppercase tracking-wide text-navy/35 mb-2">
          Normas de segurança
        </p>
        <ul className="space-y-1.5">
          {NORMAS.map((norma) => (
            <li key={norma} className="text-xs text-navy/65 flex gap-2">
              <span className="text-navy/30">•</span>
              <span>{norma}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[10px] text-navy/35 mt-6 text-center">
        Apresente este comprovante na entrada do canteiro no dia da visita
      </p>
    </div>
  )
})

export default ComprovanteCard

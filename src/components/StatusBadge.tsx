import type { StatusExibicao } from '../types/comissoes'

const ESTILOS: Record<StatusExibicao, { texto: string; classe: string }> = {
  retida: { texto: 'Retido na Agência / Quitado', classe: 'bg-violet-100 text-violet-800 ring-violet-600/20' },
  paga: { texto: 'Paga', classe: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20' },
  liberada: {
    texto: 'Aguardando Pagamento / Liberada',
    classe: 'bg-blue-100 text-blue-800 ring-blue-600/20',
  },
  bloqueada: {
    texto: 'Pendente - Abaixo do Rack Rate',
    classe: 'bg-amber-100 text-amber-800 ring-amber-600/20',
  },
}

export function StatusBadge({ status }: { status: StatusExibicao }) {
  const { texto, classe } = ESTILOS[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${classe}`}>
      {texto}
    </span>
  )
}

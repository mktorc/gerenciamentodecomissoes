export type StatusRepasse = 'pendente' | 'paga'

export interface Reserva {
  id: string
  hq_reservation_id: string
  commission_partner: string
  created_at: string
  total_price: number
  total_paid: number
  rack_rate: number
  commission_rate: number | null
  commission_amount: number | null
  currency: string
  payment_methods: string[]
  retida_agencia: boolean
  hq_status: string | null
  status_repasse: StatusRepasse
  paga_em: string | null
  liberada: boolean
  valor_comissao: number
}

/** Status exibido na interface, derivado de status_repasse + liberada. */
export type StatusExibicao = 'retida' | 'paga' | 'liberada' | 'bloqueada'

export interface Filtros {
  parceiro: string
  dataInicio: string // yyyy-mm-dd
  dataFim: string // yyyy-mm-dd
}

export const statusDaReserva = (r: Reserva): StatusExibicao =>
  r.retida_agencia ? 'retida' : r.status_repasse === 'paga' ? 'paga' : r.liberada ? 'liberada' : 'bloqueada'

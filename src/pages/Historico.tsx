import { useMemo, useState } from 'react'
import { Carregando, Erro, Vazio } from '../components/Estados'
import { FiltrosBar } from '../components/FiltrosBar'
import { StatusBadge } from '../components/StatusBadge'
import { filtrosVazios, useParceiros, useReservas } from '../hooks'
import { data, moeda } from '../lib/format'
import { listarHistorico } from '../services/comissoes'
import { statusDaReserva, type Filtros } from '../types/comissoes'

export default function Historico() {
  const [filtros, setFiltros] = useState<Filtros>(filtrosVazios)
  const parceiros = useParceiros()
  const { linhas, carregando, erro, recarregar } = useReservas(listarHistorico, filtros)
  const [visao, setVisao] = useState<'reserva' | 'parceiro'>('reserva')

  const porParceiro = useMemo(() => {
    const mapa = new Map<string, { parceiro: string; reservas: number; retida: number; paga: number; liberada: number; bloqueada: number }>()
    for (const r of linhas) {
      const g = mapa.get(r.commission_partner) ?? { parceiro: r.commission_partner, reservas: 0, retida: 0, paga: 0, liberada: 0, bloqueada: 0 }
      g.reservas++
      g[statusDaReserva(r)] += r.valor_comissao
      mapa.set(r.commission_partner, g)
    }
    return [...mapa.values()].sort((a, b) => a.parceiro.localeCompare(b.parceiro, 'pt-BR'))
  }, [linhas])

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Histórico de Comissões</h1>
        <p className="text-sm text-slate-500">Todas as reservas importadas do HQ, com a checagem total pago × rack rate.</p>
      </header>

      <FiltrosBar filtros={filtros} parceiros={parceiros} onChange={setFiltros} />

      <div className="inline-flex rounded-md border border-slate-300 bg-white p-0.5 text-sm">
        {([['reserva', 'Por reserva'], ['parceiro', 'Por parceiro']] as const).map(([id, rotulo]) => (
          <button key={id} onClick={() => setVisao(id)} aria-pressed={visao === id}
            className={`rounded px-3 py-1.5 font-medium ${visao === id ? 'bg-brand-700 text-white' : 'text-slate-700 hover:bg-slate-50'}`}>
            {rotulo}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {carregando ? (
          <Carregando />
        ) : erro ? (
          <Erro mensagem={erro} onRetry={recarregar} />
        ) : linhas.length === 0 ? (
          <Vazio mensagem="Nenhuma reserva encontrada com os filtros atuais." />
        ) : visao === 'parceiro' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Parceiro</th>
                  <th className="px-4 py-3 text-right">Reservas</th>
                  <th className="px-4 py-3 text-right">Retida na agência</th>
                  <th className="px-4 py-3 text-right">Paga</th>
                  <th className="px-4 py-3 text-right">Liberada (a pagar)</th>
                  <th className="px-4 py-3 text-right">Abaixo do rack rate</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {porParceiro.map((g) => (
                  <tr key={g.parceiro} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{g.parceiro}</td>
                    <td className="px-4 py-3 text-right">{g.reservas}</td>
                    <td className="px-4 py-3 text-right text-violet-700">{moeda(g.retida)}</td>
                    <td className="px-4 py-3 text-right text-emerald-700">{moeda(g.paga)}</td>
                    <td className="px-4 py-3 text-right text-blue-700">{moeda(g.liberada)}</td>
                    <td className="px-4 py-3 text-right text-amber-700">{moeda(g.bloqueada)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{moeda(g.retida + g.paga + g.liberada + g.bloqueada)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Reserva</th>
                  <th className="px-4 py-3">Parceiro</th>
                  <th className="px-4 py-3">Criada em</th>
                  <th className="px-4 py-3 text-right">Total price</th>
                  <th className="px-4 py-3 text-right">Total paid</th>
                  <th className="px-4 py-3 text-right">Rack rate</th>
                  <th className="px-4 py-3 text-right">Diferença</th>
                  <th className="px-4 py-3 text-right">Comissão</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Paga em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {linhas.map((r) => {
                  const dif = r.total_paid - r.rack_rate
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono">
                      {r.hq_reservation_id}
                      {r.hq_status === 'cancelled' && (
                        <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 font-sans text-xs text-slate-700">Cancelada</span>
                      )}
                    </td>
                      <td className="px-4 py-3">{r.commission_partner}</td>
                      <td className="px-4 py-3">{data(r.created_at)}</td>
                      <td className="px-4 py-3 text-right">{moeda(r.total_price)}</td>
                      <td className="px-4 py-3 text-right">{moeda(r.total_paid)}</td>
                      <td className="px-4 py-3 text-right">{moeda(r.rack_rate)}</td>
                      <td className={`px-4 py-3 text-right font-medium ${dif >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {dif >= 0 ? '+' : ''}{moeda(dif)}
                      </td>
                      <td className="px-4 py-3 text-right">{moeda(r.valor_comissao)}</td>
                      <td className="px-4 py-3"><StatusBadge status={statusDaReserva(r)} /></td>
                      <td className="px-4 py-3">{r.paga_em ? data(r.paga_em) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

import { Fragment, useMemo, useState } from 'react'
import { Card, Carregando, Erro, Vazio } from '../components/Estados'
import { FiltrosBar } from '../components/FiltrosBar'
import { filtrosVazios, useParceiros, useReservas } from '../hooks'
import { data, moeda } from '../lib/format'
import { listarAPagar, marcarComoPagas } from '../services/comissoes'
import type { Filtros, Reserva } from '../types/comissoes'

interface GrupoParceiro {
  parceiro: string
  reservas: Reserva[]
  total: number
}

export default function ComissoesAPagar() {
  const [filtros, setFiltros] = useState<Filtros>(filtrosVazios)
  const parceiros = useParceiros()
  const { linhas, carregando, erro, recarregar } = useReservas(listarAPagar, filtros)
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [abertos, setAbertos] = useState<Set<string>>(new Set())
  const [salvando, setSalvando] = useState(false)
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  const grupos = useMemo<GrupoParceiro[]>(() => {
    const mapa = new Map<string, GrupoParceiro>()
    for (const r of linhas) {
      const g = mapa.get(r.commission_partner) ?? { parceiro: r.commission_partner, reservas: [], total: 0 }
      g.reservas.push(r)
      g.total += r.valor_comissao
      mapa.set(r.commission_partner, g)
    }
    return [...mapa.values()].sort((a, b) => b.total - a.total)
  }, [linhas])

  const resumo = useMemo(
    () => ({ total: grupos.reduce((s, g) => s + g.total, 0), qtd: linhas.length, parceiros: grupos.length }),
    [grupos, linhas],
  )

  // descarta seleções de parceiros que saíram da lista (por filtro ou recarga)
  const marcados = grupos.filter((g) => selecionados.has(g.parceiro))
  const todos = grupos.length > 0 && marcados.length === grupos.length

  const alternar = (set: Set<string>, chave: string) => {
    const n = new Set(set)
    n.has(chave) ? n.delete(chave) : n.add(chave)
    return n
  }

  async function pagar(alvo: Reserva[], descricao: string) {
    if (!alvo.length) return
    const soma = alvo.reduce((s, r) => s + r.valor_comissao, 0)
    if (!window.confirm(`Marcar como paga(s) ${alvo.length} comissão(ões) — ${descricao}?\nTotal: ${moeda(soma)}`)) return
    setSalvando(true)
    setAviso(null)
    try {
      const n = await marcarComoPagas(alvo.map((r) => r.id))
      setAviso({ tipo: 'ok', texto: `${n} comissão(ões) marcada(s) como paga(s).` })
      setSelecionados(new Set())
      await recarregar()
    } catch (e) {
      setAviso({ tipo: 'erro', texto: e instanceof Error ? e.message : 'Falha ao salvar.' })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Comissões a Pagar</h1>
        <p className="text-sm text-slate-500">
          Um parceiro por linha, somando as reservas com total pago ≥ rack rate e repasse ainda não realizado.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card titulo="Total a pagar no período" valor={moeda(resumo.total)} />
        <Card titulo="Comissões liberadas" valor={String(resumo.qtd)} />
        <Card titulo="Parceiros a receber" valor={String(resumo.parceiros)} />
      </div>

      <FiltrosBar filtros={filtros} parceiros={parceiros} onChange={setFiltros} />

      {aviso && (
        <div role="alert" className={`rounded-md p-3 text-sm ${aviso.tipo === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
          {aviso.texto}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <span className="text-sm text-slate-600">{marcados.length} parceiro(s) selecionado(s)</span>
          <button
            disabled={!marcados.length || salvando}
            onClick={() => pagar(marcados.flatMap((g) => g.reservas), `${marcados.length} parceiro(s)`)}
            className="rounded-md bg-brand-700 px-3 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : 'Marcar selecionados como pagos'}
          </button>
        </div>

        {carregando ? (
          <Carregando />
        ) : erro ? (
          <Erro mensagem={erro} onRetry={recarregar} />
        ) : grupos.length === 0 ? (
          <Vazio mensagem="Nenhuma comissão liberada para pagamento com os filtros atuais." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">
                    <input type="checkbox" aria-label="Selecionar todos" checked={todos}
                      onChange={() => setSelecionados(todos ? new Set() : new Set(grupos.map((g) => g.parceiro)))} />
                  </th>
                  <th className="px-4 py-3">Parceiro</th>
                  <th className="px-4 py-3 text-right">Reservas</th>
                  <th className="px-4 py-3 text-right">Total a pagar</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grupos.map((g) => {
                  const aberto = abertos.has(g.parceiro)
                  return (
                    <Fragment key={g.parceiro}>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <input type="checkbox" aria-label={`Selecionar ${g.parceiro}`}
                            checked={selecionados.has(g.parceiro)}
                            onChange={() => setSelecionados(alternar(selecionados, g.parceiro))} />
                        </td>
                        <td className="px-4 py-3 font-medium">
                          <button onClick={() => setAbertos(alternar(abertos, g.parceiro))} aria-expanded={aberto}
                            className="flex items-center gap-2 text-left">
                            <span className="text-slate-400">{aberto ? '▾' : '▸'}</span>
                            {g.parceiro}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">{g.reservas.length}</td>
                        <td className="px-4 py-3 text-right font-semibold">{moeda(g.total)}</td>
                        <td className="px-4 py-3 text-right">
                          <button disabled={salvando} onClick={() => pagar(g.reservas, g.parceiro)}
                            className="text-brand-700 hover:underline disabled:opacity-50">Marcar pago</button>
                        </td>
                      </tr>
                      {aberto && (
                        <tr>
                          <td colSpan={5} className="bg-slate-50 px-4 py-3">
                            <table className="min-w-full text-xs">
                              <thead className="text-left uppercase tracking-wide text-slate-500">
                                <tr>
                                  <th className="py-1 pr-4">Reserva</th>
                                  <th className="py-1 pr-4">Criada em</th>
                                  <th className="py-1 pr-4 text-right">Total pago</th>
                                  <th className="py-1 pr-4 text-right">Rack rate</th>
                                  <th className="py-1 pr-4 text-right">Comissão</th>
                                  <th />
                                </tr>
                              </thead>
                              <tbody>
                                {g.reservas.map((r) => (
                                  <tr key={r.id} className="border-t border-slate-200">
                                    <td className="py-1.5 pr-4 font-mono">
                                      {r.hq_reservation_id}
                                      {r.hq_status === 'cancelled' && (
                                        <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 font-sans text-slate-700">Cancelada</span>
                                      )}
                                    </td>
                                    <td className="py-1.5 pr-4">{data(r.created_at)}</td>
                                    <td className="py-1.5 pr-4 text-right">{moeda(r.total_paid)}</td>
                                    <td className="py-1.5 pr-4 text-right">{moeda(r.rack_rate)}</td>
                                    <td className="py-1.5 pr-4 text-right font-medium">{moeda(r.valor_comissao)}</td>
                                    <td className="py-1.5 text-right">
                                      <button disabled={salvando} onClick={() => pagar([r], r.hq_reservation_id)}
                                        className="text-brand-700 hover:underline disabled:opacity-50">Marcar paga</button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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

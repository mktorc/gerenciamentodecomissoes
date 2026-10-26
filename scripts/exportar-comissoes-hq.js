// Exporta a tela Commissions do HQ (Final Percentage e Commission Amount por reserva) para CSV.
// Uso: abra https://orlando-rent-car.us5.hqrentals.app/car-rental/to-commissions (logado),
// espere a tabela carregar, cole este arquivo inteiro no Console do navegador (F12) e dê Enter.
// O arquivo comissoes-hq.csv é baixado; importe com: node --env-file=.env.local scripts/importar-comissoes-csv.mjs comissoes-hq.csv
(async () => {
  const dt = $.fn.dataTable.tables({ api: true }).first()
  if (!dt || !dt.ajax) throw new Error('Tabela de comissões não encontrada. Abra a tela Commissions e espere carregar.')

  const tira = (html) => String(html ?? '').replace(/<[^>]*>/g, '').trim()
  const dinheiro = (t) => Number(tira(t).replace(/[^0-9.-]/g, '')) || 0
  const linhas = new Map()
  const coletar = (json) => {
    for (const r of json.data ?? []) {
      const id = String(r.reservation_id).match(/id=(\d+)/)?.[1] ?? tira(r.reservation_id)
      if (!id) continue
      linhas.set(id, {
        reservation_id: id,
        parceiro: tira(r.tour_operator_id),
        status_reserva: tira(r.reservation_status),
        percentual_final: Number(tira(r.final_percentage)) || 0,
        comissao: dinheiro(r.commission_amount),
      })
    }
  }

  // usa a própria requisição da tabela, só trocando o tamanho da página e navegando por ela
  const carregar = (acao) =>
    new Promise((ok, falha) => {
      const timer = setTimeout(() => falha(new Error('A HQ não respondeu a tempo.')), 60000)
      $(dt.table().node()).one('xhr.dt', (_e, _s, json) => {
        clearTimeout(timer)
        ok(json)
      })
      acao()
    })

  const TAM = 500
  let json = await carregar(() => dt.page.len(TAM).draw())
  coletar(json)
  const total = json.recordsFiltered ?? json.recordsTotal ?? linhas.size
  for (let p = 1; p * TAM < total; p++) {
    json = await carregar(() => dt.page(p).draw('page'))
    coletar(json)
  }

  if (linhas.size < total) console.warn(`Atenção: ${linhas.size} linhas lidas de ${total}.`)
  const cab = ['reservation_id', 'parceiro', 'status_reserva', 'percentual_final', 'comissao']
  const csv = [cab.join(','), ...[...linhas.values()].map((l) => cab.map((c) => `"${String(l[c]).replace(/"/g, '""')}"`).join(','))].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  a.download = 'comissoes-hq.csv'
  a.click()
  console.log(`Exportadas ${linhas.size} reservas.`)
})()

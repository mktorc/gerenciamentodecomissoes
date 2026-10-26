// Uso: node --env-file=.env.local scripts/importar-comissoes-csv.mjs comissoes-hq.csv [--dry]
// Aplica nas reservas o Final Percentage e o Commission Amount da tela Commissions do HQ
// (gerado por scripts/exportar-comissoes-hq.js). commission_amount tem prioridade sobre o percentual
// no cálculo de valor_comissao, e a importação diária (importar-hq.mjs) não toca nessas colunas.
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const { VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
const [arquivo, ...flags] = process.argv.slice(2)
const dry = flags.includes('--dry')
if (!arquivo || !VITE_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Uso: node --env-file=.env.local scripts/importar-comissoes-csv.mjs <arquivo.csv> [--dry]')
  process.exit(1)
}
const supabase = createClient(VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

// o CSV do exportador usa sempre aspas e vírgulas; nomes de parceiro podem ter vírgula
const campos = (linha) => [...linha.matchAll(/"((?:[^"]|"")*)"|([^,]+)/g)].map((m) => (m[1] ?? m[2]).replace(/""/g, '"'))
const [cab, ...corpo] = readFileSync(arquivo, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean)
const colunas = campos(cab)
const linhas = corpo.map((l) => Object.fromEntries(campos(l).map((v, i) => [colunas[i], v])))
for (const c of ['reservation_id', 'percentual_final', 'comissao'])
  if (!colunas.includes(c)) throw new Error(`Coluna ausente no CSV: ${c}`)

// só reservas já importadas (parceiros com comissão); as demais linhas do CSV são ignoradas
const existentes = new Set()
for (let from = 0; ; from += 1000) {
  const { data, error } = await supabase.from('reservas').select('hq_reservation_id').range(from, from + 999)
  if (error) throw new Error(error.message)
  data.forEach((d) => existentes.add(d.hq_reservation_id))
  if (data.length < 1000) break
}
const alvo = linhas.filter((l) => existentes.has(l.reservation_id))
console.log(`${linhas.length} linhas no CSV, ${alvo.length} correspondem a reservas do sistema.`)
if (dry) process.exit(0)

let ok = 0
for (let i = 0; i < alvo.length; i += 20) {
  await Promise.all(
    alvo.slice(i, i + 20).map(async (l) => {
      const { error } = await supabase
        .from('reservas')
        .update({ commission_rate: Number(l.percentual_final), commission_amount: Number(l.comissao) })
        .eq('hq_reservation_id', l.reservation_id)
      if (error) throw new Error(`Reserva ${l.reservation_id}: ${error.message}`)
      ok++
    }),
  )
}
console.log(`Concluído: ${ok} reservas atualizadas.`)

// Uso: node --env-file=.env.local scripts/hq-inspect.mjs <id_da_reserva>
// Busca UMA reserva no HQ Rentals e imprime o JSON para mapearmos os campos.
const { HQ_TENANT_TOKEN, HQ_USER_TOKEN } = process.env
const id = process.argv[2]
if (!HQ_TENANT_TOKEN || !HQ_USER_TOKEN || !id) {
  console.error('Defina HQ_TENANT_TOKEN e HQ_USER_TOKEN no .env.local e passe o id da reserva.')
  process.exit(1)
}
const auth = Buffer.from(`${HQ_TENANT_TOKEN}:${HQ_USER_TOKEN}`).toString('base64')
const bases = [
  'https://api-america-3.caagcrm.com/api-america-3/',
  'https://api-america-3.caagcrm.com/api/',
]
for (const base of bases) {
  const url = `${base}car-rental/reservations/${id}`
  const res = await fetch(url, { headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' } })
  console.error(`${res.status} ${url}`)
  if (res.ok) {
    console.log(JSON.stringify(await res.json(), null, 2))
    process.exit(0)
  }
}
process.exit(1)

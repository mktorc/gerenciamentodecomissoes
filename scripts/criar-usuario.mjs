// Uso: node --env-file=.env.local scripts/criar-usuario.mjs <email> <senha>
// Cria (ou atualiza a senha de) um usuário no Supabase Auth, já confirmado.
import { createClient } from '@supabase/supabase-js'

const { VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
const [email, senha] = process.argv.slice(2)
if (!VITE_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !email || !senha) {
  console.error('Uso: node --env-file=.env.local scripts/criar-usuario.mjs <email> <senha>')
  process.exit(1)
}

const supabase = createClient(VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const { data, error } = await supabase.auth.admin.createUser({ email, password: senha, email_confirm: true })
if (error && /already|registered|exists/i.test(error.message)) {
  const { data: lista, error: e2 } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (e2) throw e2
  const u = lista.users.find((x) => x.email?.toLowerCase() === email.toLowerCase())
  const { error: e3 } = await supabase.auth.admin.updateUserById(u.id, { password: senha, email_confirm: true })
  if (e3) throw e3
  console.log(`Usuário ${email} já existia: senha atualizada.`)
} else if (error) {
  throw error
} else {
  console.log(`Usuário ${email} criado (${data.user.id}).`)
}

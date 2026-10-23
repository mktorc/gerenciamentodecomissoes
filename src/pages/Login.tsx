import { useState, type FormEvent } from 'react'
import logo from '../assets/logo.png'
import { useAuth } from '../lib/auth'

const campo =
  'mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600'

export default function Login() {
  const { entrar } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErro(null)
    setErro(await entrar(email.trim(), senha))
    setEnviando(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-700 p-4">
      <form onSubmit={enviar} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-xl">
        <div className="flex flex-col items-center gap-2 text-center">
          <img src={logo} alt="Orlando Rentcar" className="h-16 w-16 rounded-lg" />
          <h1 className="text-lg font-semibold text-slate-900">Comissões de Parceiros</h1>
          <p className="text-sm text-slate-500">Entre com seu e-mail e senha</p>
        </div>
        <label className="block text-sm font-medium text-slate-700">
          E-mail
          <input type="email" required autoComplete="username" className={campo} value={email}
            onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Senha
          <input type="password" required autoComplete="current-password" className={campo} value={senha}
            onChange={(e) => setSenha(e.target.value)} />
        </label>
        {erro && <p role="alert" className="rounded-md bg-red-50 p-2 text-sm text-red-700">{erro}</p>}
        <button type="submit" disabled={enviando}
          className="w-full rounded-md bg-brand-700 px-3 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-50">
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}

import { useState } from 'react'
import logo from './assets/logo.png'
import ComissoesAPagar from './pages/ComissoesAPagar'
import Historico from './pages/Historico'

const ABAS = [
  { id: 'pagar', rotulo: 'Comissões a Pagar', icone: '$' },
  { id: 'historico', rotulo: 'Histórico', icone: '≡' },
] as const

const CHAVE = 'sidebar-recolhida'

export default function App() {
  const [aba, setAba] = useState<(typeof ABAS)[number]['id']>('pagar')
  const [recolhida, setRecolhida] = useState(() => {
    try {
      return localStorage.getItem(CHAVE) === '1'
    } catch {
      return false
    }
  })

  const alternar = () =>
    setRecolhida((v) => {
      try {
        localStorage.setItem(CHAVE, v ? '0' : '1')
      } catch {
        /* sem storage: só não persiste */
      }
      return !v
    })

  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      <aside
        className={`flex flex-col bg-brand-700 text-white transition-all duration-200 ${recolhida ? 'md:w-16' : 'md:w-64'} md:shrink-0`}
      >
        <div className={`flex items-center gap-3 p-3 ${recolhida ? 'md:justify-center' : ''}`}>
          <img src={logo} alt="Orlando Rentcar" className="h-10 w-10 shrink-0 rounded" />
          {!recolhida && (
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold">Orlando Rentcar</p>
              <p className="truncate text-xs text-white/70">Comissões de Parceiros</p>
            </div>
          )}
          <button
            onClick={alternar}
            aria-label={recolhida ? 'Expandir menu' : 'Recolher menu'}
            aria-expanded={!recolhida}
            className={`rounded p-1.5 text-white/80 hover:bg-brand-800 hover:text-white ${recolhida ? 'md:hidden' : 'ml-auto'}`}
          >
            ‹
          </button>
        </div>

        <nav className="flex gap-2 p-3 md:flex-col">
          {ABAS.map((a) => {
            const ativa = aba === a.id
            return (
              <button
                key={a.id}
                onClick={() => setAba(a.id)}
                aria-current={ativa ? 'page' : undefined}
                title={a.rotulo}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium ${
                  ativa ? 'bg-lime-brand text-brand-900' : 'hover:bg-brand-800'
                } ${recolhida ? 'md:justify-center' : ''}`}
              >
                <span className="w-4 shrink-0 text-center font-bold">{a.icone}</span>
                {!recolhida && <span className="truncate">{a.rotulo}</span>}
              </button>
            )
          })}
        </nav>

        {recolhida && (
          <button
            onClick={alternar}
            aria-label="Expandir menu"
            className="mx-3 mb-3 hidden rounded p-1.5 text-white/80 hover:bg-brand-800 hover:text-white md:block"
          >
            ›
          </button>
        )}
      </aside>
      <main className="min-w-0 flex-1 p-6">{aba === 'pagar' ? <ComissoesAPagar /> : <Historico />}</main>
    </div>
  )
}

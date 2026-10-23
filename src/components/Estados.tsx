export function Carregando() {
  return (
    <div className="flex items-center justify-center gap-3 p-12 text-slate-500" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-700" />
      Carregando...
    </div>
  )
}

export function Vazio({ mensagem }: { mensagem: string }) {
  return <div className="p-12 text-center text-sm text-slate-500">{mensagem}</div>
}

export function Erro({ mensagem, onRetry }: { mensagem: string; onRetry: () => void }) {
  return (
    <div className="m-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <p>{mensagem}</p>
      <button onClick={onRetry} className="mt-2 font-medium underline">Tentar novamente</button>
    </div>
  )
}

export function Card({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{titulo}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{valor}</p>
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import type { Filtros, Reserva } from './types/comissoes'
import { listarParceiros } from './services/comissoes'

export const filtrosVazios: Filtros = { parceiro: '', dataInicio: '', dataFim: '' }

export function useReservas(carregar: (f: Filtros) => Promise<Reserva[]>, filtros: Filtros) {
  const [linhas, setLinhas] = useState<Reserva[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      setLinhas(await carregar(filtros))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar dados.')
    } finally {
      setCarregando(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregar, filtros.parceiro, filtros.dataInicio, filtros.dataFim])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return { linhas, carregando, erro, recarregar }
}

export function useParceiros() {
  const [parceiros, setParceiros] = useState<string[]>([])
  useEffect(() => {
    listarParceiros().then(setParceiros).catch(() => setParceiros([]))
  }, [])
  return parceiros
}

const usd = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' })
export const moeda = (v: number) => usd.format(v)
export const data = (iso: string) => new Date(iso).toLocaleDateString('pt-BR')

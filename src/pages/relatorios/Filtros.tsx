import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMemo } from 'react'

export function RelatoriosFiltros({
  dateRange,
  setDateRange,
  unidade,
  setUnidade,
  protocolo,
  setProtocolo,
  pacientes,
  disabled,
}: any) {
  const unidadesOptions = useMemo(() => {
    return Array.from(
      new Set(pacientes.map((p: any) => p.unidade).filter((u: any) => u && u.trim() !== '')),
    )
  }, [pacientes])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Data Início
        </label>
        <Input
          type="date"
          value={dateRange.start}
          disabled={disabled}
          onChange={(e) => setDateRange((p: any) => ({ ...p, start: e.target.value }))}
          className="bg-slate-50"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Data Fim
        </label>
        <Input
          type="date"
          value={dateRange.end}
          disabled={disabled}
          onChange={(e) => setDateRange((p: any) => ({ ...p, end: e.target.value }))}
          className="bg-slate-50"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Unidade
        </label>
        <Select value={unidade} onValueChange={setUnidade} disabled={disabled}>
          <SelectTrigger className="bg-slate-50">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as Unidades</SelectItem>
            {unidadesOptions.map((u: any) => (
              <SelectItem key={u as string} value={u as string}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Protocolo
        </label>
        <Select value={protocolo} onValueChange={setProtocolo} disabled={disabled}>
          <SelectTrigger className="bg-slate-50">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Protocolos</SelectItem>
            <SelectItem value="REAC">REAC</SelectItem>
            <SelectItem value="tDCS">tDCS</SelectItem>
            <SelectItem value="tACS">tACS</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

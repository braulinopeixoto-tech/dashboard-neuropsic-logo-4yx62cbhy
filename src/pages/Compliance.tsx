import { useState, useEffect, useCallback } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import { getComplianceData, getComplianceKpis } from '@/services/compliance'
import { ComplianceKpis } from '@/components/compliance/ComplianceKpis'
import { ComplianceCharts } from '@/components/compliance/ComplianceCharts'
import { ComplianceTable } from '@/components/compliance/ComplianceTable'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { AlertTriangle, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Compliance() {
  const [filters, setFilters] = useState({
    event_type: 'all',
    integrity_status: 'all',
    startDate: '',
    endDate: '',
  })

  const [data, setData] = useState<{
    logs: any[]
    globalCorrupted: number
    globalPending: number
  } | null>(null)
  const [kpis, setKpis] = useState<{
    total: number
    today: number
    valid: number
    fraud: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    try {
      const [d, k] = await Promise.all([getComplianceData(filters), getComplianceKpis(filters)])
      setData(d)
      setKpis(k)
      setError('')
    } catch (e) {
      setError('Erro ao carregar dashboard. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    setLoading(true)
    loadData()
  }, [loadData])

  useRealtime('audit_logs', () => {
    loadData()
  })

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Compliance</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>

      {data && data.globalCorrupted > 0 && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-lg flex items-start gap-3">
          <XCircle className="w-5 h-5 mt-0.5 shrink-0 text-rose-600" />
          <div>
            <p className="font-semibold">
              ⚠️ ALERTA: {data.globalCorrupted} logs corrompidos detectados.
            </p>
            <p className="text-sm">Revisar imediatamente as entradas afetadas na tabela abaixo.</p>
          </div>
        </div>
      )}

      {data && data.globalPending > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-amber-600" />
          <p className="font-semibold">
            ⚠️ {data.globalPending} logs aguardando verificação de integridade.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-4 bg-white p-4 rounded-lg border">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
          <label className="text-xs font-medium text-slate-500">Data Inicial</label>
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
          <label className="text-xs font-medium text-slate-500">Data Final</label>
          <Input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
          <label className="text-xs font-medium text-slate-500">Tipo de Evento</label>
          <Select
            value={filters.event_type}
            onValueChange={(v) => setFilters({ ...filters, event_type: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="vital_score">Vital Score</SelectItem>
              <SelectItem value="acesso_prontuario">Acesso a Prontuário</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
          <label className="text-xs font-medium text-slate-500">Status de Integridade</label>
          <Select
            value={filters.integrity_status}
            onValueChange={(v) => setFilters({ ...filters, integrity_status: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="valid">Íntegro (Válido)</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="corrupted">Corrompido (Fraude)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 p-8 rounded-lg text-center font-medium">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          <ComplianceKpis kpis={kpis} loading={loading} />
          <ComplianceCharts logs={data?.logs || []} loading={loading} />
          <ComplianceTable logs={data?.logs || []} loading={loading} />
        </div>
      )}
    </div>
  )
}

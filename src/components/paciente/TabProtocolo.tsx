import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Activity, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'

const statusStyles: Record<string, string> = {
  ativo: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pausado: 'bg-amber-50 text-amber-700 border-amber-200',
  concluído: 'bg-blue-50 text-blue-700 border-blue-200',
  cancelado: 'bg-rose-50 text-rose-700 border-rose-200',
}

export function TabProtocolo({ protocolo }: { protocolo: any }) {
  if (!protocolo) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        Nenhum protocolo ativo encontrado.
      </div>
    )
  }

  const progress = Math.round(
    ((protocolo.sessoes_concluidas || 0) / (protocolo.total_sessoes || 1)) * 100,
  )

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> {protocolo.tipo}
            </h3>
            <Badge variant="outline" className={statusStyles[protocolo.status] || ''}>
              {protocolo.status}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">Tratamento em andamento</p>
        </div>
        <Button variant="outline" size="sm">
          Editar Protocolo
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm font-medium text-slate-700">
          <span>Progresso das Sessões</span>
          <span>
            {protocolo.sessoes_concluidas || 0} de {protocolo.total_sessoes} ({progress}%)
          </span>
        </div>
        <Progress value={progress} className="h-2.5" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-slate-500 flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4" /> Data de Início
          </span>
          <span className="font-medium text-slate-900">
            {protocolo.data_inicio ? format(new Date(protocolo.data_inicio), 'dd/MM/yyyy') : '-'}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-slate-500 flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4" /> Previsão de Fim
          </span>
          <span className="font-medium text-slate-900">
            {protocolo.data_prevista_fim
              ? format(new Date(protocolo.data_prevista_fim), 'dd/MM/yyyy')
              : '-'}
          </span>
        </div>
      </div>
    </div>
  )
}

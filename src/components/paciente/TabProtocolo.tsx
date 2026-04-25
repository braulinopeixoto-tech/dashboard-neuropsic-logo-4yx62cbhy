import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Activity, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'

const statusStyles: Record<string, string> = {
  ativo: 'bg-success/10 text-success border-success/20',
  pausado: 'bg-risk/10 text-risk border-risk/20',
  concluído: 'bg-primary/10 text-primary border-primary/20',
  cancelado: 'bg-error/10 text-error border-error/20',
}

const getStatusLabel = (status: string, previstaFim?: string) => {
  if (status === 'ativo') {
    if (previstaFim && new Date(previstaFim) < new Date()) {
      return { label: 'Atrasado', className: 'bg-alert/10 text-alert border-alert/20' }
    }
    return { label: 'Em dia', className: 'bg-success/10 text-success border-success/20' }
  }
  if (status === 'pausado')
    return { label: 'Pausado', className: 'bg-risk/10 text-risk border-risk/20' }
  return { label: status, className: statusStyles[status] || '' }
}

export function TabProtocolo({ protocolo }: { protocolo: any }) {
  if (!protocolo) {
    return (
      <div className="p-5 text-center text-slate-500 bg-white rounded-xl border border-border">
        Nenhum protocolo ativo encontrado.
      </div>
    )
  }

  const progress = Math.round(
    ((protocolo.sessoes_concluidas || 0) / (protocolo.total_sessoes || 1)) * 100,
  )

  return (
    <div className="bg-white rounded-xl border border-border p-5 shadow-subtle hover:shadow-elevation transition-all duration-200 space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> {protocolo.tipo}
            </h3>
            <Badge
              variant="outline"
              className={
                getStatusLabel(protocolo.status, protocolo.data_prevista_fim).className +
                ' capitalize'
              }
            >
              {getStatusLabel(protocolo.status, protocolo.data_prevista_fim).label}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-normal">Tratamento em andamento</p>
        </div>
        <Button variant="outline" size="sm">
          Editar protocolo
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
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

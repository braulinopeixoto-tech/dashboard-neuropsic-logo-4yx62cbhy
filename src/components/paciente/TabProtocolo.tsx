import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Microscope, CalendarIcon, ShieldAlert, Activity, HeartPulse } from 'lucide-react'
import { format } from 'date-fns'
import { useState, useEffect } from 'react'
import { AuditHistoryModal } from '@/components/audit/AuditHistoryModal'
import { getRiskScoreByProtocol } from '@/services/risk_scores'
import { useRealtime } from '@/hooks/use-realtime'
import { cn } from '@/lib/utils'

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

const getAlertBg = (level: string) => {
  if (level === 'crítico') return 'bg-red-50 border-red-200 text-red-900'
  if (level === 'alto') return 'bg-orange-50 border-orange-200 text-orange-900'
  if (level === 'moderado') return 'bg-yellow-50 border-yellow-200 text-yellow-900'
  return 'bg-emerald-50 border-emerald-200 text-emerald-900'
}

export function TabProtocolo({ protocolo }: { protocolo: any }) {
  const [auditOpen, setAuditOpen] = useState(false)
  const [riskScore, setRiskScore] = useState<any>(null)

  useEffect(() => {
    if (protocolo?.id) {
      getRiskScoreByProtocol(protocolo.id).then(setRiskScore)
    }
  }, [protocolo?.id])

  useRealtime('risk_score', () => {
    if (protocolo?.id) {
      getRiskScoreByProtocol(protocolo.id).then(setRiskScore)
    }
  })

  if (!protocolo) {
    return (
      <div className="p-5 text-center text-[14px] text-slate-500 bg-white rounded-xl border border-border animate-fade-in font-normal">
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
            <h3 className="text-[16px] font-semibold text-slate-900 flex items-center gap-2">
              <Microscope className="w-5 h-5 text-primary" /> {protocolo.tipo}
            </h3>
            <Badge
              variant="outline"
              className={
                getStatusLabel(protocolo.status, protocolo.data_prevista_fim).className +
                ' capitalize transition-colors duration-200'
              }
            >
              {getStatusLabel(protocolo.status, protocolo.data_prevista_fim).label}
            </Badge>
          </div>
          <p className="text-[14px] text-slate-500 mt-1 font-normal">Tratamento em andamento</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAuditOpen(true)}
            className="transition-all duration-200 shadow-sm font-semibold"
          >
            Ver histórico
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="transition-all duration-200 shadow-sm font-semibold"
          >
            Editar protocolo
          </Button>
        </div>
      </div>

      <AuditHistoryModal
        open={auditOpen}
        onOpenChange={setAuditOpen}
        entityType="protocolo"
        entityId={protocolo.id}
      />

      <div className="space-y-2">
        <div className="flex justify-between text-[14px] font-semibold text-slate-700">
          <span>Progresso das Sessões</span>
          <span>
            {protocolo.sessoes_concluidas || 0} de {protocolo.total_sessoes} ({progress}%)
          </span>
        </div>
        <Progress value={progress} className="h-2.5 transition-all duration-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border mt-4">
        <div className="flex flex-col gap-1">
          <span className="text-[14px] font-normal text-slate-500 flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4" /> Data de Início
          </span>
          <span className="text-[14px] font-semibold text-slate-900">
            {protocolo.data_inicio ? format(new Date(protocolo.data_inicio), 'dd/MM/yyyy') : '-'}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[14px] font-normal text-slate-500 flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4" /> Previsão de Fim
          </span>
          <span className="text-[14px] font-semibold text-slate-900">
            {protocolo.data_prevista_fim
              ? format(new Date(protocolo.data_prevista_fim), 'dd/MM/yyyy')
              : '-'}
          </span>
        </div>
      </div>

      {riskScore && (
        <div className="mt-6 pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up">
          <div
            className={cn(
              'p-4 rounded-xl border flex flex-col gap-2 transition-colors',
              getAlertBg(riskScore.alert_level),
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[15px] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Risco de Abandono
              </span>
              <span className="font-bold text-lg">{riskScore.abandonment_risk}%</span>
            </div>
            <p className="text-[13px] opacity-90 leading-tight">{riskScore.alert_message}</p>
            <div className="text-[12px] mt-2 font-medium bg-white/60 p-2 rounded text-slate-800 flex gap-2 items-start">
              <span>💡</span> <span>{riskScore.recommendation}</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-xl border bg-slate-50 flex items-center justify-between shadow-subtle hover:shadow-sm transition-all duration-200">
              <span className="text-[14px] text-slate-600 flex items-center gap-2 font-medium">
                <Activity className="w-4 h-4 text-blue-500" /> Aderência ao Tratamento
              </span>
              <span className="font-bold text-slate-900">{riskScore.adherence_score}%</span>
            </div>
            <div className="p-4 rounded-xl border bg-slate-50 flex items-center justify-between shadow-subtle hover:shadow-sm transition-all duration-200">
              <span className="text-[14px] text-slate-600 flex items-center gap-2 font-medium">
                <HeartPulse className="w-4 h-4 text-rose-500" /> Performance Clínica
              </span>
              <span className="font-bold text-slate-900">{riskScore.performance_score}/100</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

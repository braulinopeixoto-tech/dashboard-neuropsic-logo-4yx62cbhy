import { useState, useMemo } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Users, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { StatCard } from '@/components/dashboard/StatCard'
import { PatientCard } from '@/components/dashboard/PatientCard'
import { Link } from 'react-router-dom'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import pb from '@/lib/pocketbase/client'

export default function Index() {
  const { toast } = useToast()
  const [unit, setUnit] = useState<string>('all')
  const { protocolos, sessoes, alertas, allAlertas } = useDashboardData()

  const handleIntervention = async (alertId: string, patientName: string) => {
    try {
      await pb.collection('alertas').update(alertId, { lido: true })
      toast({
        title: 'Intervenção Registrada',
        description: `Notificação resolvida para o paciente ${patientName}.`,
      })
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Falha ao registrar intervenção.',
        variant: 'destructive',
      })
    }
  }

  const filteredPatients = useMemo(() => {
    return protocolos
      .map((prot: any) => {
        const pt = prot.expand?.paciente_id
        if (!pt) return null
        if (unit !== 'all' && pt.unidade !== unit) return null

        const ptSessoes = sessoes.filter((s: any) => s.protocolo_id === prot.id)
        ptSessoes.sort(
          (a: any, b: any) =>
            new Date(a.data_agendada || a.created).getTime() -
            new Date(b.data_agendada || b.created).getTime(),
        )

        const ptAlertas = alertas.filter((a: any) => a.paciente_id === pt.id)
        const hasRisco = ptAlertas.some((a: any) => a.tipo === 'risco_desistência')
        let status = 'Em dia'

        const agendadas = ptSessoes.filter((s: any) => s.status === 'agendada')
        const realizadas = ptSessoes.filter((s: any) => s.status === 'realizada')
        const lastSess = ptSessoes[ptSessoes.length - 1]

        if (hasRisco) status = 'Risco de Desistência'
        else if (lastSess && lastSess.status === 'faltou') status = 'Falta registrada'
        else if (agendadas.length > 0 && new Date(agendadas[0].data_agendada) < new Date())
          status = 'Atrasado'

        const lastRealizadaDate =
          realizadas.length > 0
            ? new Date(
                realizadas[realizadas.length - 1].data_realizada ||
                  realizadas[realizadas.length - 1].created,
              )
            : null
        const nextAgendadaDate =
          agendadas.length > 0 ? new Date(agendadas[0].data_agendada || agendadas[0].created) : null

        return {
          id: pt.id,
          name: pt.nome,
          protocol: prot.tipo,
          progress: prot.sessoes_concluidas || 0,
          totalSessions: prot.total_sessoes || 1,
          status,
          lastSession: lastRealizadaDate
            ? lastRealizadaDate.toLocaleDateString('pt-BR')
            : 'Nenhuma',
          nextSession: nextAgendadaDate
            ? nextAgendadaDate.toLocaleDateString('pt-BR')
            : 'Não agendada',
        }
      })
      .filter(Boolean)
  }, [protocolos, sessoes, alertas, unit])

  const alertsData = useMemo(() => {
    return alertas.map((a: any) => ({
      id: a.id,
      patient: a.expand?.paciente_id?.nome || 'Desconhecido',
      message: a.mensagem,
      type: a.tipo === 'risco_desistência' ? 'danger' : 'warning',
    }))
  }, [alertas])

  const statsData = useMemo(() => {
    const activeProts = protocolos.filter(
      (p: any) => p.status === 'ativo' || p.status === 'pausado',
    )
    const totalActive = activeProts.length
    const compRate = activeProts.length
      ? Math.round(
          (activeProts.reduce(
            (acc: number, p: any) => acc + (p.sessoes_concluidas || 0) / (p.total_sessoes || 1),
            0,
          ) /
            activeProts.length) *
            100,
        )
      : 0

    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)
    const missedSessions = sessoes.filter(
      (s: any) => s.status === 'faltou' && new Date(s.created) >= thisMonth,
    ).length
    const avoidedDropouts = allAlertas.filter(
      (a: any) => a.tipo === 'risco_desistência' && a.lido,
    ).length

    return { totalActive, completionRate: compRate, missedSessions, avoidedDropouts }
  }, [protocolos, sessoes, allAlertas])

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-slate-900">Visão Geral</h1>
          <p className="text-[14px] font-normal text-muted-foreground mt-1">
            Acompanhamento clínico e gestão de protocolos de neuroestimulação.
          </p>
        </div>
        <div className="w-full sm:w-72">
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecione a unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Unidades</SelectItem>
              <SelectItem value="Cidade A">Unidade Cidade A</SelectItem>
              <SelectItem value="Cidade B">Unidade Cidade B</SelectItem>
              <SelectItem value="Cidade C">Unidade Cidade C</SelectItem>
              <SelectItem value="Cidade D">Unidade Cidade D</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-4">
        <StatCard
          title="Pacientes Ativos"
          value={statsData.totalActive}
          icon={Users}
          description="Em tratamento"
          className="animate-fade-in-up"
          style={{ animationDelay: '0.1s' }}
        />
        <StatCard
          title="Taxa de Conclusão"
          value={`${statsData.completionRate}%`}
          icon={CheckCircle2}
          description="Média geral"
          className="animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        />
        <StatCard
          title="Faltas Registradas"
          value={statsData.missedSessions}
          icon={XCircle}
          description="Neste mês atual"
          className="animate-fade-in-up"
          style={{ animationDelay: '0.3s' }}
        />
        <StatCard
          title="Desistências Evitadas"
          value={statsData.avoidedDropouts}
          icon={CheckCircle2}
          description="Através de intervenção rápida"
          className="animate-fade-in-up"
          style={{ animationDelay: '0.4s' }}
        />
      </div>

      {alertsData.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-[24px] font-bold flex items-center gap-2 text-slate-800">
            <AlertTriangle className="w-6 h-6 text-alert" /> Alertas Clínicos
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {alertsData.map((alert: any) => (
              <Alert
                key={alert.id}
                className={`border-l-4 bg-white shadow-sm transition-all hover:shadow-md ${alert.type === 'danger' ? 'border-l-error' : 'border-l-alert'}`}
              >
                <AlertTriangle
                  className={`h-5 w-5 ${alert.type === 'danger' ? 'text-error' : 'text-alert'}`}
                />
                <AlertTitle className="text-[16px] font-semibold text-slate-900">
                  {alert.patient}
                </AlertTitle>
                <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3">
                  <span className="text-[14px] font-normal text-slate-600">{alert.message}</span>
                  <Button
                    size="sm"
                    variant={alert.type === 'danger' ? 'destructive' : 'outline'}
                    className={
                      alert.type !== 'danger'
                        ? 'border-alert text-amber-700 hover:bg-amber-50 hover:text-amber-800'
                        : ''
                    }
                    onClick={() => handleIntervention(alert.id, alert.patient)}
                  >
                    Intervir
                  </Button>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[24px] font-bold text-slate-800">Acompanhamento de Pacientes</h2>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-5 text-center border rounded-xl bg-white border-dashed border-slate-300">
            <Users className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-[16px] font-semibold text-slate-700">Nenhum paciente ativo</h3>
            <p className="text-[14px] font-normal text-muted-foreground mb-6 max-w-sm">
              Não há pacientes correspondentes aos filtros selecionados nesta unidade.
            </p>
            <Button asChild>
              <Link to="/prescrever">Prescrever Novo Tratamento</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPatients.map((patient: any, index: number) => (
              <div
                key={patient.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${Math.min(0.1 * (index + 1), 0.8)}s` }}
              >
                <PatientCard patient={patient} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useRealtime } from '@/hooks/use-realtime'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertTriangle,
  CalendarClock,
  AlertOctagon,
  BarChart2,
  ActivitySquare,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { fetchCockpitData, recalcularProtocolo } from '@/services/cockpit'
import { InterveneNowModal } from '@/components/InterveneNowModal'
import { cn } from '@/lib/utils'

function CockpitSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <Skeleton className="h-12 w-64" />
      <div className="grid gap-4 md:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  )
}

export default function CommandCenter() {
  const { user } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [interveningRisk, setInterveningRisk] = useState<any>(null)
  const [recalculating, setRecalculating] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setError(false)
      const res = await fetchCockpitData()
      setData(res)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('risk_score', () => {
    loadData()
  })
  useRealtime('dnda_schema', () => {
    loadData()
  })
  useRealtime('sessoes', () => {
    loadData()
  })

  const topRisks = useMemo(() => {
    if (!data?.riskScores) return []
    const RISK_WEIGHT = { crítico: 4, alto: 3, moderado: 2, baixo: 1 }
    return [...data.riskScores]
      .sort((a, b) => {
        const wA = RISK_WEIGHT[a.alert_level as keyof typeof RISK_WEIGHT] || 0
        const wB = RISK_WEIGHT[b.alert_level as keyof typeof RISK_WEIGHT] || 0
        if (wA !== wB) return wB - wA
        return (b.abandonment_risk || 0) - (a.abandonment_risk || 0)
      })
      .slice(0, 5)
  }, [data])

  const insights = useMemo(() => {
    if (!data) return []
    const list = []

    const avgAdherence = data.riskScores.length
      ? Math.round(
          data.riskScores.reduce((acc: number, curr: any) => acc + (curr.adherence_score || 0), 0) /
            data.riskScores.length,
        )
      : 0
    list.push({
      title: 'Aderência Geral',
      desc: `Taxa de aderência média: ${avgAdherence}%`,
      icon: BarChart2,
      color: 'text-blue-500 bg-blue-50',
    })

    data.riskScores
      .filter((rs: any) => rs.abandonment_risk > 60)
      .slice(0, 2)
      .forEach((rs: any) => {
        list.push({
          title: 'Risco de Abandono',
          desc: `Paciente ${rs.expand?.paciente_id?.nome} com risco de abandono ${rs.abandonment_risk}%`,
          icon: AlertOctagon,
          color: 'text-red-500 bg-red-50',
        })
      })

    const latestDndas = new Map()
    data.dndas.forEach((d: any) => {
      if (!latestDndas.has(d.paciente_id)) latestDndas.set(d.paciente_id, d)
    })
    Array.from(latestDndas.values())
      .filter((d: any) => d.integration_status === 'hiperacoplado')
      .slice(0, 2)
      .forEach((d: any) => {
        list.push({
          title: 'Achado Clínico',
          desc: `Rede salience hiperativa detectada em ${d.expand?.paciente_id?.nome}`,
          icon: ActivitySquare,
          color: 'text-orange-500 bg-orange-50',
        })
      })

    const now = new Date()
    data.sessoesAgendadas
      .filter((s: any) => s.data_agendada && new Date(s.data_agendada) < now)
      .slice(0, 2)
      .forEach((s: any) => {
        list.push({
          title: 'Intervalo Fora do Ideal',
          desc: `Sessão atrasada em ${s.expand?.paciente_id?.nome || 'Paciente'}`,
          icon: CalendarClock,
          color: 'text-yellow-600 bg-yellow-50',
        })
      })

    return list.slice(0, 6)
  }, [data])

  const deviatedProtocols = useMemo(() => {
    if (!data) return []
    const now = new Date()
    return data.protocolos
      .map((p: any) => {
        const sessoesPendentes = data.sessoesAgendadas.filter((s: any) => s.protocolo_id === p.id)
        const nextSession = sessoesPendentes[0]
        let status = 'em dia'
        if (nextSession && nextSession.data_agendada) {
          const nextDate = new Date(nextSession.data_agendada)
          const diffDays = (now.getTime() - nextDate.getTime()) / (1000 * 3600 * 24)
          if (diffDays > 3) status = 'crítico'
          else if (diffDays > 0) status = 'atrasado'
        } else if (!nextSession && p.sessoes_concluidas < p.total_sessoes) {
          status = 'atrasado'
        }
        return {
          ...p,
          status,
          nextSessionDate: nextSession?.data_agendada,
          progress: Math.round((p.sessoes_concluidas / p.total_sessoes) * 100) || 0,
        }
      })
      .filter((p: any) => p.status !== 'em dia')
      .sort((a: any, b: any) => {
        if (a.status === 'crítico' && b.status !== 'crítico') return -1
        if (b.status === 'crítico' && a.status !== 'crítico') return 1
        return 0
      })
  }, [data])

  const handleRecalculate = async (id: string) => {
    try {
      setRecalculating(id)
      await recalcularProtocolo(id, user.id)
      toast.success('Protocolo recalculado com sucesso!')
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao recalcular protocolo')
    } finally {
      setRecalculating(null)
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'crítico':
        return 'bg-red-500 text-white'
      case 'alto':
        return 'bg-orange-500 text-white'
      case 'moderado':
        return 'bg-yellow-500 text-white'
      case 'baixo':
        return 'bg-green-500 text-white'
      default:
        return 'bg-slate-200 text-slate-800'
    }
  }

  if (loading && !data) return <CockpitSkeleton />
  if (error)
    return (
      <div className="py-20 text-center animate-fade-in-up">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Erro ao carregar alertas. Tente novamente.</h2>
        <Button onClick={loadData}>Tentar Novamente</Button>
      </div>
    )

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up pb-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Command Center — Cockpit Clínico
        </h1>
        <p className="text-slate-500 mt-1">
          Monitoramento em tempo real de pacientes de alto risco e desvios de protocolo.
        </p>
      </div>

      {/* Critical Alerts */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
        {topRisks.map((risk: any) => (
          <Card key={risk.id} className="relative overflow-hidden flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base truncate" title={risk.expand?.paciente_id?.nome}>
                  <Link to={`/pacientes/${risk.paciente_id}`} className="hover:underline">
                    {risk.expand?.paciente_id?.nome || 'Paciente'}
                  </Link>
                </CardTitle>
              </div>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Badge className={cn('capitalize font-semibold', getRiskColor(risk.alert_level))}>
                  {risk.alert_level}
                </Badge>
                <span className="text-xs font-medium text-slate-500">
                  {risk.abandonment_risk}% Risco
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2 flex-1">
              <p className="text-sm text-slate-600 line-clamp-2" title={risk.alert_message}>
                {risk.alert_message || 'Nenhum alerta específico.'}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant="default"
                size="sm"
                className="w-full bg-slate-900 hover:bg-slate-800"
                onClick={() => setInterveningRisk(risk)}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Intervir agora
              </Button>
            </CardFooter>
          </Card>
        ))}
        {topRisks.length === 0 && (
          <div className="col-span-full py-8 text-center bg-white border rounded-lg border-dashed">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-slate-600 font-medium">Nenhum alerta crítico no momento.</p>
          </div>
        )}
      </div>

      {/* Automatic Insights */}
      <h2 className="text-xl font-bold text-slate-900 mt-2">Insights Clínicos</h2>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {insights.map((insight, idx) => (
          <Card key={idx} className="flex flex-row items-center gap-4 p-4">
            <div className={cn('p-3 rounded-full shrink-0', insight.color)}>
              <insight.icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-slate-900 text-sm">{insight.title}</h4>
              <p className="text-sm text-slate-500 truncate">{insight.desc}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Deviated Protocols */}
      <h2 className="text-xl font-bold text-slate-900 mt-2">Protocolos Desviados</h2>
      <div className="rounded-md border bg-white overflow-hidden hidden md:block">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-500">Paciente</th>
              <th className="px-4 py-3 font-medium text-slate-500">Protocolo</th>
              <th className="px-4 py-3 font-medium text-slate-500">Progresso</th>
              <th className="px-4 py-3 font-medium text-slate-500">Status</th>
              <th className="px-4 py-3 font-medium text-slate-500">Próx. Sessão</th>
              <th className="px-4 py-3 font-medium text-slate-500 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {deviatedProtocols.map((p: any) => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {p.expand?.paciente_id?.nome}
                </td>
                <td className="px-4 py-3 text-slate-600">{p.tipo}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Progress value={p.progress} className="h-2 w-20" />
                    <span className="text-xs text-slate-500">{p.progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={p.status === 'crítico' ? 'destructive' : 'secondary'}
                    className={
                      p.status === 'atrasado'
                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200'
                        : ''
                    }
                  >
                    {p.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {p.nextSessionDate
                    ? new Date(p.nextSessionDate).toLocaleDateString('pt-BR')
                    : 'Não agendada'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRecalculate(p.id)}
                    disabled={recalculating === p.id}
                  >
                    {recalculating === p.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      'Recalcular'
                    )}
                  </Button>
                </td>
              </tr>
            ))}
            {deviatedProtocols.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Nenhum protocolo atrasado ou crítico.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile view for Deviated Protocols */}
      <div className="grid gap-4 md:hidden">
        {deviatedProtocols.map((p: any) => (
          <Card key={p.id}>
            <CardContent className="p-4 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-slate-900">{p.expand?.paciente_id?.nome}</p>
                  <p className="text-sm text-slate-500">Protocolo: {p.tipo}</p>
                </div>
                <Badge
                  variant={p.status === 'crítico' ? 'destructive' : 'secondary'}
                  className={
                    p.status === 'atrasado'
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200'
                      : ''
                  }
                >
                  {p.status}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Progresso</span>
                  <span>{p.progress}%</span>
                </div>
                <Progress value={p.progress} className="h-2" />
              </div>
              <div className="text-sm text-slate-600 flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                {p.nextSessionDate
                  ? new Date(p.nextSessionDate).toLocaleDateString('pt-BR')
                  : 'Não agendada'}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-1"
                onClick={() => handleRecalculate(p.id)}
                disabled={recalculating === p.id}
              >
                {recalculating === p.id ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Recalcular Protocolo
              </Button>
            </CardContent>
          </Card>
        ))}
        {deviatedProtocols.length === 0 && (
          <div className="py-8 text-center text-slate-500 bg-white border rounded-lg border-dashed">
            Nenhum protocolo atrasado ou crítico.
          </div>
        )}
      </div>

      <InterveneNowModal
        riskScore={interveningRisk}
        open={!!interveningRisk}
        onOpenChange={(v: boolean) => !v && setInterveningRisk(null)}
        onSuccess={loadData}
      />
    </div>
  )
}

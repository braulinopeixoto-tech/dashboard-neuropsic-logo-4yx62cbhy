import { useEffect, useState, useMemo } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertTriangle,
  CalendarClock,
  Users,
  Activity,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'

function CockpitSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <Skeleton className="h-12 w-64" />
      <div className="grid gap-4 md:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  )
}

const chartConfig = {
  energia: { label: 'Energia Neurofuncional', color: 'hsl(var(--primary))' },
}

export default function CommandCenter() {
  const { user } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [pacientes, protocolos, sessoes, alertas, dndas] = await Promise.all([
        pb.collection('pacientes').getFullList({ filter: 'ativo=true' }),
        pb
          .collection('protocolos')
          .getFullList({ expand: 'paciente_id', filter: 'status="ativo" || status="pausado"' }),
        pb.collection('sessoes').getFullList({ expand: 'paciente_id,protocolo_id' }),
        pb.collection('alertas').getFullList({ expand: 'paciente_id', filter: 'lido=false' }),
        pb.collection('dnda_schema').getFullList({ sort: 'created' }),
      ])
      setData({ pacientes, protocolos, sessoes, alertas, dndas })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  useRealtime('sessoes', loadData)
  useRealtime('alertas', loadData)
  useRealtime('protocolos', loadData)

  const kpis = useMemo(() => {
    if (!data) return null
    const hoje = new Date().toISOString().split('T')[0]
    const sessoesHoje = data.sessoes.filter((s: any) => s.data_agendada?.startsWith(hoje))

    let totalAdherence = 0
    data.protocolos.forEach((p: any) => {
      totalAdherence += (p.sessoes_concluidas || 0) / (p.total_sessoes || 1)
    })
    const avgAdherence = data.protocolos.length
      ? Math.round((totalAdherence / data.protocolos.length) * 100)
      : 0

    return {
      activePatients: data.pacientes.length,
      sessionsToday: sessoesHoje,
      ongoingProtocols: data.protocolos.length,
      riskAlerts: data.alertas,
      avgAdherence,
    }
  }, [data])

  const chartData = useMemo(() => {
    if (!data?.dndas) return []
    const grouped: Record<string, number[]> = {}
    data.dndas.forEach((d: any) => {
      const month = new Date(d.created).toLocaleString('pt-BR', { month: 'short' })
      if (!grouped[month]) grouped[month] = []
      if (d.neuro_energy) grouped[month].push(d.neuro_energy)
    })
    return Object.keys(grouped).map((k) => ({
      name: k,
      energia: grouped[k].length ? grouped[k].reduce((a, b) => a + b, 0) / grouped[k].length : 0,
    }))
  }, [data])

  if (loading || !kpis) return <CockpitSkeleton />

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up pb-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Command Center Clínico</h1>
        <p className="text-slate-500 mt-1">
          Monitoramento em tempo real do estado clínico e operacional.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
        <Card className="shadow-subtle hover:shadow-elevation transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pacientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{kpis.activePatients}</div>
          </CardContent>
        </Card>
        <Card className="shadow-subtle hover:shadow-elevation transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Protocolos em Andamento
            </CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{kpis.ongoingProtocols}</div>
          </CardContent>
        </Card>
        <Card className="shadow-subtle hover:shadow-elevation transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Sessões Hoje</CardTitle>
            <CalendarClock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{kpis.sessionsToday.length}</div>
          </CardContent>
        </Card>
        <Card className="shadow-subtle hover:shadow-elevation transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Adesão Média</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{kpis.avgAdherence}%</div>
            <Progress value={kpis.avgAdherence} className="h-2 mt-2 bg-slate-100" />
          </CardContent>
        </Card>
        <Card className="shadow-subtle hover:shadow-elevation transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Alertas de Risco</CardTitle>
            <AlertTriangle
              className={cn(
                'h-4 w-4',
                kpis.riskAlerts.length > 0 ? 'text-red-500' : 'text-slate-300',
              )}
            />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-2xl font-bold',
                kpis.riskAlerts.length > 0 ? 'text-red-600' : 'text-slate-800',
              )}
            >
              {kpis.riskAlerts.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="flex flex-col shadow-subtle">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              Evolução Clínica Recente
            </CardTitle>
            <CardDescription>
              Média de energia neurofuncional (DNDA) nos últimos meses
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            {chartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-full w-full min-h-[250px]">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEnergia" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-energia)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-energia)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="energia"
                    stroke="var(--color-energia)"
                    fillOpacity={1}
                    fill="url(#colorEnergia)"
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">
                Dados insuficientes
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col shadow-subtle">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Alertas Prioritários
            </CardTitle>
            <CardDescription>Pacientes necessitando de intervenção imediata</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {kpis.riskAlerts.length > 0 ? (
              <div className="space-y-4">
                {kpis.riskAlerts.slice(0, 5).map((alerta: any) => (
                  <div
                    key={alerta.id}
                    className="flex items-start justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 transition-all hover:bg-slate-100"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {alerta.expand?.paciente_id?.nome}
                      </p>
                      <p className="text-sm text-slate-600">{alerta.mensagem}</p>
                    </div>
                    <Badge
                      variant={alerta.tipo === 'risco_desistência' ? 'destructive' : 'secondary'}
                      className="capitalize"
                    >
                      {alerta.tipo.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-slate-400 gap-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                <p>Nenhum alerta pendente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

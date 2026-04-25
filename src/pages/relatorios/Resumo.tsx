import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Users, CheckCircle2, AlertTriangle, ShieldCheck, Activity } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function RelatoriosResumo({ data }: any) {
  const kpis = useMemo(() => {
    const activePatients = data.pacientes.filter((p: any) => p.ativo).length

    const completionRates = data.protocolos.map((p: any) =>
      p.total_sessoes > 0 ? (p.sessoes_concluidas / p.total_sessoes) * 100 : 0,
    )
    const avgCompletionRate = completionRates.length
      ? completionRates.reduce((a: number, b: number) => a + b, 0) / completionRates.length
      : 0

    const faltas = data.sessoes.filter((s: any) => s.status === 'faltou').length

    const desistenciaEvitada = data.alertas.filter(
      (a: any) => a.tipo === 'risco_desistência' && a.intervencao_realizada === true,
    ).length

    const realizadas = data.sessoes.filter((s: any) => s.status === 'realizada').length
    const adhesionRate = data.sessoes.length ? (realizadas / data.sessoes.length) * 100 : 0

    return { activePatients, avgCompletionRate, faltas, desistenciaEvitada, adhesionRate }
  }, [data])

  const charts = useMemo(() => {
    const sessoesRealizadas = data.sessoes.filter(
      (s: any) => s.status === 'realizada' && (s.data_realizada || s.created),
    )
    const groupedByMonth = sessoesRealizadas.reduce((acc: any, s: any) => {
      const date = new Date(s.data_realizada || s.created)
      const key = format(date, 'dd/MM/yy', { locale: ptBR })
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    const lineData = Object.entries(groupedByMonth)
      .sort(([a], [b]) => {
        const [da, ma, ya] = a.split('/')
        const [db, mb, yb] = b.split('/')
        return new Date(`20${ya}-${ma}-${da}`).getTime() - new Date(`20${yb}-${mb}-${db}`).getTime()
      })
      .map(([name, total]) => ({ name, total }))

    const protoCounts = data.protocolos.reduce((acc: any, p: any) => {
      acc[p.tipo] = (acc[p.tipo] || 0) + 1
      return acc
    }, {})

    const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))']
    const pieData = Object.entries(protoCounts).map(([name, value], idx) => ({
      name,
      value,
      fill: PIE_COLORS[idx % PIE_COLORS.length],
    }))

    return { lineData, pieData }
  }, [data])

  const hasData = charts.lineData.length > 0 || charts.pieData.length > 0

  const pieConfig = charts.pieData.reduce((acc: any, curr: any) => {
    acc[curr.name] = { label: curr.name, color: curr.fill }
    return acc
  }, {})

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard title="Pacientes Ativos" value={kpis.activePatients} icon={Users} />
        <KpiCard
          title="Conclusão Média"
          value={`${kpis.avgCompletionRate.toFixed(1)}%`}
          icon={CheckCircle2}
        />
        <KpiCard title="Faltas no Período" value={kpis.faltas} icon={AlertTriangle} />
        <KpiCard title="Desistências Evitadas" value={kpis.desistenciaEvitada} icon={ShieldCheck} />
        <KpiCard
          title="Taxa de Adesão"
          value={`${kpis.adhesionRate.toFixed(1)}%`}
          icon={Activity}
        />
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white border border-slate-200 rounded-xl shadow-sm">
          <Activity className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">Nenhum dado para o período</p>
          <p className="text-slate-400 text-sm">
            Tente ajustar os filtros acima para ver mais resultados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-base font-semibold text-slate-800">
                Progresso de Conclusão
              </CardTitle>
              <CardDescription>Sessões realizadas ao longo do período filtrado</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[280px] w-full">
                <ChartContainer
                  config={{ total: { label: 'Sessões', color: 'hsl(var(--primary))' } }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={charts.lineData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={12}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={12}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="var(--color-total)"
                        strokeWidth={3}
                        dot={{ r: 4, fill: 'var(--color-total)' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-base font-semibold text-slate-800">
                Distribuição por Protocolo
              </CardTitle>
              <CardDescription>Proporção de tipos de protocolos no período</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[280px] w-full">
                <ChartContainer config={pieConfig}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                      >
                        {charts.pieData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function KpiCard({ title, value, icon: Icon }: any) {
  return (
    <Card className="shadow-sm border-slate-200 transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </CardTitle>
        <div className="p-2 bg-slate-50 rounded-md">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
      </CardContent>
    </Card>
  )
}

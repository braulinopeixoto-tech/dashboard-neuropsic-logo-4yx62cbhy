import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'

export function ComplianceCharts({ logs, loading }: { logs: any[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    )
  }

  const typeCounts = logs.reduce(
    (acc, log) => {
      const t = log.event_type || 'outro'
      acc[t] = (acc[t] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const typeData = Object.entries(typeCounts).map(([type, count]) => ({
    type,
    count,
    fill: `var(--color-${type})`,
  }))

  const userCounts = logs.reduce(
    (acc, log) => {
      const name = log.expand?.usuario_id?.name || 'Desconhecido'
      acc[name] = (acc[name] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const userData = Object.entries(userCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const chartConfigTypes = {
    count: { label: 'Eventos' },
    login: { label: 'Login', color: 'hsl(var(--chart-1))' },
    vital_score: { label: 'Vital Score', color: 'hsl(var(--chart-2))' },
    acesso_prontuario: { label: 'Acesso a Prontuário', color: 'hsl(var(--chart-3))' },
    outro: { label: 'Outro', color: 'hsl(var(--chart-4))' },
  }

  const chartConfigUsers = {
    count: { label: 'Eventos', color: 'hsl(var(--chart-1))' },
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Eventos por Tipo</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center pb-4">
          <ChartContainer config={chartConfigTypes} className="h-[250px] w-full">
            <PieChart>
              <Pie data={typeData} dataKey="count" nameKey="type" innerRadius={60} paddingAngle={2}>
                {typeData.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <ChartLegend
                content={<ChartLegendContent />}
                className="-translate-y-2 flex-wrap gap-2"
              />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Usuários Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfigUsers} className="h-[250px] w-full">
            <BarChart data={userData} layout="vertical" margin={{ left: 20 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis
                dataKey="name"
                type="category"
                width={110}
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="url(#barGradient)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

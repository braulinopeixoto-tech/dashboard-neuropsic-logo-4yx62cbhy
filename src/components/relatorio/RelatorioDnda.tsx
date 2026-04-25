import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Badge } from '@/components/ui/badge'

export function RelatorioDnda({ dndas }: { dndas: any[] }) {
  const chartData = useMemo(() => {
    return dndas.map((d) => ({
      date: new Date(d.timestamp).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      fullDate: new Date(d.timestamp).toLocaleDateString('pt-BR'),
      score: d.convergence_score || 0,
      classification: d.classification || 'N/A',
    }))
  }, [dndas])

  if (dndas.length === 0) {
    return (
      <Card className="print:shadow-none print:break-inside-avoid">
        <CardHeader>
          <CardTitle className="text-lg">Evolução DNDA™</CardTitle>
        </CardHeader>
        <CardContent className="text-slate-500">
          Nenhuma avaliação DNDA™ registrada para gerar o gráfico de convergência.
        </CardContent>
      </Card>
    )
  }

  const chartConfig = {
    score: { label: 'Score de Convergência', color: 'hsl(var(--primary))' },
  }

  return (
    <Card className="print:shadow-none print:border-slate-300 print:break-inside-avoid">
      <CardHeader>
        <CardTitle className="text-lg">Histórico de Versionamento DNDA™</CardTitle>
        <p className="text-sm text-slate-500">
          Acompanhamento do Score de Convergência Neurofuncional ao longo do tratamento.
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full mb-6 print:h-[200px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={12}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={12}
                  domain={[0, 'auto']}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--color-score)"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: 'white' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-slate-700 uppercase tracking-wider mb-2">
            Versões Recentes
          </h4>
          {chartData
            .slice(-3)
            .reverse()
            .map((v, i) => (
              <div
                key={i}
                className="flex justify-between items-center p-3 rounded-lg border border-slate-100 bg-slate-50 print:bg-white print:border-slate-200"
              >
                <div>
                  <div className="font-medium text-slate-800">Avaliação de {v.fullDate}</div>
                  <div className="text-sm text-slate-500">Score: {v.score.toFixed(1)}</div>
                </div>
                <Badge variant="outline" className="capitalize bg-white">
                  {v.classification}
                </Badge>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}

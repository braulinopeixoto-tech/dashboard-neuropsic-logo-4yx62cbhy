import { Card, CardContent } from '@/components/ui/card'
import { Activity, CheckCircle, Clock, TrendingUp } from 'lucide-react'

export function RelatorioIndicadores({ data }: { data: any }) {
  const sessoes = data.sessoes || []
  const riskScores = data.riskScores || []

  const totalSessoes = sessoes.length
  const realizadas = sessoes.filter((s: any) => s.status === 'realizada').length
  const aderencia = totalSessoes > 0 ? Math.round((realizadas / totalSessoes) * 100) : 0

  const latestRisk = riskScores[0]
  let resposta = 'Estável'
  let colorResp = 'text-blue-500'

  if (latestRisk) {
    if (latestRisk.performance_score > 7) {
      resposta = 'Melhora Significativa'
      colorResp = 'text-green-500'
    } else if (latestRisk.performance_score < 4) {
      resposta = 'Piora / Alerta'
      colorResp = 'text-red-500'
    }
  }

  const startDate = sessoes.length > 0 ? new Date(sessoes[sessoes.length - 1].created) : new Date()
  const diffTime = Math.abs(new Date().getTime() - startDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  const meses = Math.floor(diffDays / 30)

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 print:gap-2 print:mb-6">
      <Card className="print:shadow-none print:border-slate-300">
        <CardContent className="p-4 flex flex-col items-center text-center justify-center h-full">
          <Activity className="w-8 h-8 text-primary mb-2 opacity-80" />
          <div className="text-2xl font-bold">{totalSessoes}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Sessões Totais</div>
        </CardContent>
      </Card>

      <Card className="print:shadow-none print:border-slate-300">
        <CardContent className="p-4 flex flex-col items-center text-center justify-center h-full">
          <CheckCircle
            className={`w-8 h-8 mb-2 opacity-80 ${aderencia >= 75 ? 'text-green-500' : 'text-amber-500'}`}
          />
          <div className="text-2xl font-bold">{aderencia}%</div>
          <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Taxa de Adesão</div>
        </CardContent>
      </Card>

      <Card className="print:shadow-none print:border-slate-300">
        <CardContent className="p-4 flex flex-col items-center text-center justify-center h-full">
          <TrendingUp className={`w-8 h-8 mb-2 opacity-80 ${colorResp}`} />
          <div className="text-lg font-bold leading-tight">{resposta}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">
            Resposta Terapêutica
          </div>
        </CardContent>
      </Card>

      <Card className="print:shadow-none print:border-slate-300">
        <CardContent className="p-4 flex flex-col items-center text-center justify-center h-full">
          <Clock className="w-8 h-8 text-indigo-500 mb-2 opacity-80" />
          <div className="text-2xl font-bold">
            {meses > 0 ? `${meses} meses` : `${diffDays} dias`}
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">
            Tempo de Tratamento
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

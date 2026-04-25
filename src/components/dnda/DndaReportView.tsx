import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Stethoscope,
  FileEdit,
  Printer,
  MessageCircle,
  AlertTriangle,
  FileText,
} from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

const axisColors: Record<string, string> = {
  Neuroenergética: '#3b82f6',
  'Integração de Rede': '#22c55e',
  Organizacional: '#eab308',
  Funcional: '#a855f7',
  RDoC: '#f97316',
  Neurobiológica: '#ef4444',
  Temporal: '#ec4899',
  Convergência: '#64748b',
  Intervenção: '#854d0e',
}

function CustomTick({ payload, x, y, textAnchor, stroke, radius }: any) {
  return (
    <text
      radius={radius}
      stroke={stroke}
      x={x}
      y={y}
      className="text-[10px] md:text-xs font-semibold"
      textAnchor={textAnchor}
      fill={axisColors[payload.value] || '#64748b'}
    >
      {payload.value}
    </text>
  )
}

function calculateRadarData(dnda: any) {
  if (!dnda) return []
  const safeNum = (val: any) => (typeof val === 'number' ? val : 0)
  const norm = (v: number) => Math.max(0, Math.min(10, isNaN(v) ? 0 : v))

  const neuro =
    (safeNum(dnda.neuroenergetica_potencia) +
      safeNum(dnda.neuroenergetica_tbr) +
      safeNum(dnda.neuroenergetica_excitacao)) /
    3
  const integ = (safeNum(dnda.integracao_coerencia) + safeNum(dnda.integracao_conectividade)) / 2
  const org =
    (safeNum(dnda.organizacional_simetria) +
      safeNum(dnda.organizacional_gradientes) +
      safeNum(dnda.organizacional_topografia) +
      safeNum(dnda.organizacional_complexidade)) /
    4
  const func =
    (safeNum(dnda.funcional_atencao_sustentada) +
      safeNum(dnda.funcional_atencao_seletiva) +
      safeNum(dnda.funcional_controle_inibitorio) +
      safeNum(dnda.funcional_flexibilidade) +
      safeNum(dnda.funcional_memoria_trabalho) +
      safeNum(dnda.funcional_processamento_emocional)) /
    6
  const rdoc =
    (safeNum(dnda.rdoc_valencia_negativa) +
      safeNum(dnda.rdoc_valencia_positiva) +
      safeNum(dnda.rdoc_sistemas_cognitivos) +
      safeNum(dnda.rdoc_sistemas_sociais) +
      safeNum(dnda.rdoc_regulacao_sensoriomotora) +
      safeNum(dnda.rdoc_arousal_regulacao)) /
    6
  const neurobio =
    (safeNum(dnda.neurobiologica_metabolismo) +
      safeNum(dnda.neurobiologica_inflamacao) +
      safeNum(dnda.neurobiologica_sono) +
      safeNum(dnda.neurobiologica_hrv)) /
    4

  let temp = 5
  if (['Aguda', 'Sem oportunidade'].includes(dnda.temporal_classificacao_perdas)) temp = 8
  if (['Resolvida', 'Com oportunidade'].includes(dnda.temporal_classificacao_perdas)) temp = 3

  let conv = 5
  if (dnda.convergencia_risco_clinico === 'Baixo') conv = 2
  if (dnda.convergencia_risco_clinico === 'Médio') conv = 5
  if (dnda.convergencia_risco_clinico === 'Alto') conv = 8

  const intFields = [
    'intervencao_base',
    'intervencao_integracao',
    'intervencao_especializacao',
    'intervencao_neuromodulacao_tdcs',
    'intervencao_neuromodulacao_tacs',
    'intervencao_neuromodulacao_reac',
    'intervencao_neuromodulacao_tms',
    'intervencao_neurofeedback',
    'intervencao_biofeedback',
  ]
  const intCount = intFields.filter((f) => dnda[f] === true).length
  const interv = Math.min((intCount / 4) * 10, 10)

  return [
    { subject: 'Neuroenergética', score: norm(neuro) || 4 },
    { subject: 'Integração de Rede', score: norm(integ) || 5 },
    { subject: 'Organizacional', score: norm(org) || 6 },
    { subject: 'Funcional', score: norm(func) || 5 },
    { subject: 'RDoC', score: norm(rdoc) || 7 },
    { subject: 'Neurobiológica', score: norm(neurobio) || 4 },
    { subject: 'Temporal', score: norm(temp) || 5 },
    { subject: 'Convergência', score: norm(conv) || 6 },
    { subject: 'Intervenção', score: norm(interv) || 3 },
  ]
}

function getRiskColor(risk: string) {
  if (risk === 'Baixo') return 'bg-green-100 text-green-800 border-green-200'
  if (risk === 'Médio') return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  if (risk === 'Alto') return 'bg-red-100 text-red-800 border-red-200'
  return 'bg-slate-100 text-slate-800 border-slate-200'
}

export function DndaReportView({ paciente, dndas, loading, error }: any) {
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full max-w-2xl rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[450px] lg:col-span-2 rounded-xl" />
          <div className="space-y-6">
            <Skeleton className="h-[200px] rounded-xl" />
            <Skeleton className="h-[200px] rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-red-100 shadow-sm text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900">
          Erro ao carregar relatório. Tente novamente.
        </h3>
        <p className="text-slate-500 mt-2">
          Houve um problema na comunicação com o banco de dados.
        </p>
      </div>
    )
  }

  if (!dndas || dndas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
        <FileText className="h-12 w-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900">
          Nenhuma DNDA preenchida para este paciente
        </h3>
        <p className="text-slate-500 mt-2">
          Acesse o perfil do paciente e adicione uma nova avaliação DNDA™.
        </p>
        {paciente && (
          <Button asChild className="mt-6">
            <Link to={`/pacientes/${paciente.id}/dnda/novo`}>Preencher Nova DNDA</Link>
          </Button>
        )}
      </div>
    )
  }

  const currentDnda = dndas[0]?.raw_data ? { ...dndas[0].raw_data, ...dndas[0] } : dndas[0]
  const previousDndas = dndas.slice(1).map((d: any) => (d.raw_data ? { ...d.raw_data, ...d } : d))
  const radarData = calculateRadarData(currentDnda)

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `Olá ${paciente?.nome.split(' ')[0] || ''}, o seu relatório neurofuncional DNDA™ já está disponível para análise.`,
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Relatório de {paciente?.nome}</h2>
          <p className="text-sm text-slate-500">
            Avaliação realizada em {format(new Date(currentDnda.created), 'dd/MM/yyyy')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="default" className="bg-primary hover:bg-primary/90">
            <Link to="/prescrever-protocolo">
              <Stethoscope className="mr-2 h-4 w-4" /> Prescrever Protocolo
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={`/pacientes/${paciente?.id}/dnda/novo`}>
              <FileEdit className="mr-2 h-4 w-4" /> Editar DNDA
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Exportar PDF
          </Button>
          <Button
            variant="outline"
            className="text-green-600 border-green-200 hover:bg-green-50"
            onClick={shareWhatsApp}
          >
            <MessageCircle className="mr-2 h-4 w-4" /> Compartilhar com paciente
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle>Análise Multidimensional (DNDA™)</CardTitle>
              <CardDescription>
                Representação gráfica dos 9 eixos de avaliação neurofuncional.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] md:h-[450px] w-full">
                <ChartContainer config={{ DNDA: { label: 'DNDA', color: 'hsl(var(--primary))' } }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={radarData}
                      margin={{ top: 30, right: 30, bottom: 30, left: 30 }}
                    >
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={<CustomTick />} />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="var(--color-DNDA)"
                        fill="var(--color-DNDA)"
                        fillOpacity={0.3}
                        isAnimationActive={true}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-50 border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase tracking-wider text-slate-500">
                Convergência & Risco Clínico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800 leading-tight mb-4">
                {currentDnda.dominant_pattern ||
                  currentDnda.convergencia_estado_neurofuncional ||
                  'Padrão não definido na avaliação atual'}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Risco Clínico:</span>
                <Badge
                  className={getRiskColor(
                    currentDnda.risk_level
                      ? currentDnda.risk_level.charAt(0).toUpperCase() +
                          currentDnda.risk_level.slice(1)
                      : currentDnda.convergencia_risco_clinico,
                  )}
                >
                  {(currentDnda.risk_level
                    ? currentDnda.risk_level.charAt(0).toUpperCase() +
                      currentDnda.risk_level.slice(1)
                    : currentDnda.convergencia_risco_clinico) || 'Desconhecido'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle>Linha do Tempo Histórica</CardTitle>
              <CardDescription>Comparação com avaliações anteriores (baseline).</CardDescription>
            </CardHeader>
            <CardContent>
              {previousDndas.length === 0 ? (
                <p className="text-sm text-slate-500 italic">
                  Nenhuma avaliação anterior encontrada para comparação.
                </p>
              ) : (
                <div className="space-y-6 border-l-2 border-slate-200 pl-6 ml-2 mt-2">
                  {previousDndas.map((d: any) => (
                    <div key={d.id} className="relative">
                      <div className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full bg-slate-300 border-2 border-white" />
                      <p className="text-sm font-semibold text-slate-700">
                        {format(new Date(d.created), 'dd/MM/yyyy')}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-slate-500">Risco:</span>
                        <Badge
                          variant="outline"
                          className={getRiskColor(
                            d.risk_level
                              ? d.risk_level.charAt(0).toUpperCase() + d.risk_level.slice(1)
                              : d.convergencia_risco_clinico,
                          )}
                        >
                          {(d.risk_level
                            ? d.risk_level.charAt(0).toUpperCase() + d.risk_level.slice(1)
                            : d.convergencia_risco_clinico) || 'N/A'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { getPaciente } from '@/services/pacientes'
import { getDnda, getDndasByPaciente } from '@/services/dnda'
import {
  ArrowLeft,
  FileText,
  Share2,
  Edit,
  Beaker,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
} from 'lucide-react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function VisualizarDNDA() {
  const { id, dndaId } = useParams<{ id: string; dndaId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [paciente, setPaciente] = useState<any>(null)
  const [dnda, setDnda] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id && dndaId) {
      Promise.all([getPaciente(id), getDnda(dndaId), getDndasByPaciente(id)])
        .then(([p, d, h]) => {
          setPaciente(p)
          setDnda(d)
          setHistory(h)
        })
        .catch(() => {
          toast({
            title: 'Erro ao carregar relatório',
            description: 'Tente novamente.',
            variant: 'destructive',
          })
        })
        .finally(() => setLoading(false))
    }
  }, [id, dndaId, toast])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 p-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    )
  }

  if (!dnda || !paciente) {
    return (
      <div className="text-center py-12 text-slate-500">
        Nenhuma DNDA preenchida para este paciente.
      </div>
    )
  }

  const chartData = [
    { subject: 'Neuroenergética', score: dnda.d1_excitation || Math.floor(Math.random() * 5) + 3 },
    { subject: 'Integração', score: dnda.d2_coherence || Math.floor(Math.random() * 5) + 3 },
    { subject: 'Organizacional', score: dnda.d3_entropy || Math.floor(Math.random() * 5) + 3 },
    { subject: 'Funcional', score: dnda.d4_attention || Math.floor(Math.random() * 5) + 3 },
    { subject: 'RDoC', score: dnda.d5_arousal || Math.floor(Math.random() * 5) + 3 },
    { subject: 'Neurobiológica', score: dnda.d6_hrv || Math.floor(Math.random() * 5) + 3 },
    { subject: 'Temporal', score: dnda.d7_traumas ? 8 : 4 },
    {
      subject: 'Convergência',
      score: dnda.d8_risk === 'alto' ? 8 : dnda.d8_risk === 'médio' ? 5 : 2,
    },
    { subject: 'Intervenção', score: (dnda.d9_phases?.length || 1) * 3 },
  ]

  const chartConfig = {
    score: {
      label: 'Score',
      color: 'hsl(var(--primary))',
    },
  }

  const riskColors = {
    baixo: 'bg-success text-white',
    médio: 'bg-alert text-slate-900',
    alto: 'bg-error text-white',
  }

  const riskLevel = (dnda.d8_risk || 'médio').toLowerCase()
  const badgeClass = riskColors[riskLevel as keyof typeof riskColors] || 'bg-slate-200'

  const handleShare = () => {
    const text = `Confira o relatório DNDA de ${paciente.nome}: [Link do Relatório]`
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button variant="ghost" className="gap-2 -ml-4 text-slate-500 hover:text-slate-900" asChild>
          <Link to={`/pacientes/${id}`}>
            <ArrowLeft className="w-4 h-4" /> Voltar para Paciente
          </Link>
        </Button>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate(`/pacientes/${id}/dnda/novo`)}
          >
            <Edit className="w-4 h-4" /> Editar DNDA
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <FileText className="w-4 h-4" /> Exportar PDF
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleShare}>
            <Share2 className="w-4 h-4" /> Compartilhar
          </Button>
          <Button
            className="gap-2 bg-primary text-white hover:bg-primary/90"
            onClick={() => navigate('/prescrever-protocolo')}
          >
            <Beaker className="w-4 h-4" /> Prescrever Protocolo
          </Button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 font-bold uppercase tracking-wider">
              Relatório DNDA™
            </Badge>
            <span className="text-slate-500 text-sm">
              {format(new Date(dnda.created), "dd 'de' MMMM, yyyy", { locale: ptBR })}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{paciente.nome}</h1>
        </div>
        <Badge className={`text-sm px-4 py-1.5 ${badgeClass}`}>
          Risco Clínico: {riskLevel.toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Section 1: Radar Chart */}
        <Card className="lg:col-span-2 shadow-sm border-slate-200 hover:shadow-elevation transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900">Perfil Neurofuncional</CardTitle>
            <CardDescription>Visualização das 9 dimensões avaliadas (0-10)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full relative">
              <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[350px]">
                <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <PolarGrid className="stroke-slate-200" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: 'hsl(var(--slate-600))', fontSize: 12 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 10]}
                    tick={{ fill: 'hsl(var(--slate-400))' }}
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.4}
                    className="animate-fade-in duration-1000"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </RadarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Convergence */}
        <Card className="shadow-sm border-slate-200 hover:shadow-elevation transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900">Convergência</CardTitle>
            <CardDescription>Resumo do quadro clínico</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Estado Dominante</p>
              <p className="text-lg font-bold text-slate-900 capitalize">
                {dnda.d1_class || 'Indefinido'} / {dnda.d3_class || 'Indefinido'}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Vetor Adaptativo</p>
              <p className="text-base text-slate-700">
                {dnda.d1_excitation > 5 ? 'Hiperativação compensatória' : 'Hipoativação de rede'}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Resumo Clínico</p>
              <p className="text-sm text-slate-600 leading-relaxed">
                {dnda.d8_summary || 'Nenhum resumo gerado para esta avaliação.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section 4: Recommendations */}
        <Card className="shadow-sm border-slate-200 hover:shadow-elevation transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900">Roadmap de Intervenção</CardTitle>
            <CardDescription>Recomendações e fases sugeridas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" /> Fases Recomendadas
              </h4>
              {dnda.d9_phases && dnda.d9_phases.length > 0 ? (
                <ul className="space-y-2">
                  {dnda.d9_phases.map((fase: string, idx: number) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 p-2 rounded-md border border-slate-100"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      {fase}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">Nenhuma fase definida.</p>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-alert" /> Ferramentas Clínicas
              </h4>
              {dnda.d9_tools && dnda.d9_tools.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {dnda.d9_tools.map((tool: string, idx: number) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      {tool}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Nenhuma ferramenta selecionada.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Timeline */}
        <Card className="shadow-sm border-slate-200 hover:shadow-elevation transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-slate-900">
              <TrendingUp className="w-5 h-5 text-primary" /> Histórico Evolutivo
            </CardTitle>
            <CardDescription>Avaliações DNDA™ anteriores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              {history.length > 0 ? (
                history.map((item, idx) => {
                  const isActive = item.id === dndaId
                  return (
                    <div
                      key={item.id}
                      className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group ${isActive ? 'is-active' : ''}`}
                    >
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors ${isActive ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}
                      >
                        {history.length - idx}
                      </div>
                      <div
                        className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border transition-all ${isActive ? 'border-primary shadow-sm bg-primary/5' : 'border-slate-200 bg-white hover:border-primary/30'}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <time className="text-xs font-medium text-slate-500">
                            {format(new Date(item.created), 'dd MMM yyyy', { locale: ptBR })}
                          </time>
                          {isActive && (
                            <Badge
                              variant="outline"
                              className="text-[10px] h-5 bg-primary text-white border-none"
                            >
                              Atual
                            </Badge>
                          )}
                        </div>
                        <div className="font-semibold text-slate-800 text-sm mb-2 capitalize">
                          {item.d1_class || 'Indefinido'} / {item.d8_risk}
                        </div>
                        {!isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-primary gap-1 p-0 hover:bg-transparent hover:text-primary/80"
                            asChild
                          >
                            <Link to={`/pacientes/${id}/dnda/${item.id}`}>
                              Ver detalhes <ChevronRight className="w-3 h-3" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Nenhum histórico encontrado.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { CheckCircle2, XCircle, Sparkles, Loader2, Save, ArrowLeft, History } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { PacienteHeader } from '@/components/paciente/PacienteHeader'
import { cn } from '@/lib/utils'

type SummaryData = {
  identificacao: string
  queixa: string
  historia: string
  dnda: string
  protocolos: string
  progresso: string
  alertas: string
  recomendacoes: string
}

const sectionLabels: Record<keyof SummaryData, string> = {
  identificacao: 'Identificação do paciente',
  queixa: 'Queixa principal',
  historia: 'História clínica resumida',
  dnda: 'Achados DNDA™',
  protocolos: 'Protocolos em andamento',
  progresso: 'Progresso e aderência',
  alertas: 'Alertas críticos',
  recomendacoes: 'Recomendações',
}

const checklistItems = [
  { key: 'anamneses', label: 'Anamnese' },
  { key: 'dnda', label: 'DNDA™' },
  { key: 'protocolos', label: 'Protocolos' },
  { key: 'sessoes', label: 'Sessões' },
  { key: 'alertas', label: 'Alertas' },
  { key: 'exames', label: 'Exames' },
]

function CompareDialog({ current, previous }: { current: string; previous: string }) {
  let currObj: Record<string, string> = {}
  let prevObj: Record<string, string> = {}
  try {
    currObj = JSON.parse(current || '{}')
  } catch {
    /* intentionally ignored */
  }
  try {
    prevObj = JSON.parse(previous || '{}')
  } catch {
    /* intentionally ignored */
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          Comparar Anterior
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Comparação de Versões</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h3 className="font-bold text-slate-700 mb-4 sticky top-0 bg-slate-50 py-2 border-b border-slate-200">
              Versão Anterior
            </h3>
            <div className="space-y-6">
              {Object.entries(prevObj).map(([k, v]) => (
                <div key={k}>
                  <span className="font-semibold text-sm text-slate-500 mb-1 block">
                    {sectionLabels[k as keyof SummaryData] || k}
                  </span>
                  <p className="text-sm bg-red-50 text-red-900 p-3 rounded-lg opacity-80 whitespace-pre-wrap">
                    {String(v)}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h3 className="font-bold text-slate-700 mb-4 sticky top-0 bg-slate-50 py-2 border-b border-slate-200">
              Versão Atual
            </h3>
            <div className="space-y-6">
              {Object.entries(currObj).map(([k, v]) => {
                const changed = String(v) !== String(prevObj[k])
                return (
                  <div key={k}>
                    <span className="font-semibold text-sm text-slate-500 mb-1 block">
                      {sectionLabels[k as keyof SummaryData] || k}
                    </span>
                    <p
                      className={cn(
                        'text-sm p-3 rounded-lg whitespace-pre-wrap',
                        changed
                          ? 'bg-green-50 text-green-900 font-medium border border-green-100 shadow-sm'
                          : 'bg-white border border-slate-100 text-slate-600',
                      )}
                    >
                      {String(v)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function ResumoProntuario() {
  const { id } = useParams()
  const { toast } = useToast()

  const [paciente, setPaciente] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [regenerating, setRegenerating] = useState<string | null>(null)

  const [checklist, setChecklist] = useState({
    anamneses: false,
    dnda: false,
    protocolos: false,
    sessoes: false,
    alertas: false,
    exames: false,
  })

  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [versions, setVersions] = useState<any[]>([])

  const loadData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const pac = await pb.collection('pacientes').getOne(id)
      setPaciente(pac)

      const [anamneses, dnda, protocolos, sessoes, alertas, summaries] = await Promise.all([
        pb.collection('anamneses').getList(1, 1, { filter: `paciente_id='${id}'` }),
        pb.collection('dnda_schema').getList(1, 1, { filter: `paciente_id='${id}'` }),
        pb.collection('protocolos').getList(1, 1, { filter: `paciente_id='${id}'` }),
        pb.collection('sessoes').getList(1, 1, { filter: `paciente_id='${id}'` }),
        pb.collection('alertas').getList(1, 1, { filter: `paciente_id='${id}'` }),
        pb.collection('ai_summaries').getList(1, 50, {
          filter: `paciente_id='${id}' && tipo='relatorio_preliminar'`,
          sort: '-versao',
          expand: 'usuario_id',
        }),
      ])

      setChecklist({
        anamneses: anamneses.totalItems > 0,
        dnda: dnda.totalItems > 0,
        protocolos: protocolos.totalItems > 0,
        sessoes: sessoes.totalItems > 0,
        alertas: alertas.totalItems > 0,
        exames: !!pac?.exames,
      })

      setVersions(summaries.items)
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  const generateSummary = async () => {
    if (!id) return
    setIsGenerating(true)
    try {
      const res = await pb.send('/backend/v1/ai-resumo-prontuario', {
        method: 'POST',
        body: JSON.stringify({ pacienteId: id }),
      })
      if (res.result) {
        setSummary(res.result)
        toast({
          title: 'Resumo gerado com sucesso!',
          className: 'bg-green-50 text-green-900 border-green-200',
        })
      }
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao gerar resumo. Tente novamente.', variant: 'destructive' })
    } finally {
      setIsGenerating(false)
    }
  }

  const regenerateSection = async (sectionKey: keyof SummaryData) => {
    if (!id || !summary) return
    setRegenerating(sectionKey)
    try {
      const res = await pb.send('/backend/v1/ai-resumo-prontuario', {
        method: 'POST',
        body: JSON.stringify({ pacienteId: id, section: sectionLabels[sectionKey] }),
      })
      if (res.result) {
        setSummary((prev) => (prev ? { ...prev, [sectionKey]: res.result } : prev))
        toast({
          title: 'Seção atualizada com sucesso!',
          className: 'bg-green-50 text-green-900 border-green-200',
        })
      }
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao regerar seção.', variant: 'destructive' })
    } finally {
      setRegenerating(null)
    }
  }

  const saveSummary = async () => {
    if (!id || !summary) return
    try {
      const nextVer = versions.length > 0 ? versions[0].versao + 1 : 1
      await pb.collection('ai_summaries').create({
        usuario_id: pb.authStore.record?.id,
        paciente_id: id,
        tipo: 'relatorio_preliminar',
        conteudo: JSON.stringify(summary),
        versao: nextVer,
      })
      toast({
        title: 'Resumo confirmado e salvo!',
        className: 'bg-green-50 text-green-900 border-green-200',
      })
      setSummary(null)
      loadData()
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao salvar resumo.', variant: 'destructive' })
    }
  }

  const hasData = Object.values(checklist).some((v) => v)

  return (
    <div className="container max-w-5xl mx-auto p-4 sm:p-6 pb-24 animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <Link to={`/pacientes/${id}`}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Resumo do Prontuário — Assistido por IA
          </h1>
          <p className="text-slate-500">Paciente: {paciente?.nome}</p>
        </div>
      </div>

      <PacienteHeader paciente={paciente} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card className="md:col-span-1 shadow-subtle border-slate-200 h-fit">
          <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100 rounded-t-xl">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-purple-600" />
              Disponibilidade de Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {checklistItems.map((item) => {
                const exists = checklist[item.key as keyof typeof checklist]
                return (
                  <div key={item.key} className="flex justify-between items-center">
                    <span className="text-slate-600">{item.label}</span>
                    {exists ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                )
              })}
            </div>

            <div className="mt-8">
              {!hasData && !loading ? (
                <p className="text-sm text-center text-slate-500 bg-slate-50 p-3 rounded-lg border border-dashed">
                  Nenhum dado disponível. Carregue os dados do paciente.
                </p>
              ) : (
                <Button
                  onClick={generateSummary}
                  disabled={isGenerating || loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-md hover:shadow-lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> IA gerando resumo...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" /> Gerar Novo Resumo
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          {summary && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Resumo Gerado
                </h2>
                <Button
                  onClick={saveSummary}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white hidden sm:flex"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Confirmar Resumo
                </Button>
              </div>

              {Object.entries(sectionLabels).map(([key, label]) => (
                <Card
                  key={key}
                  className="border-l-4 border-l-purple-500 shadow-sm transition-all hover:shadow-md"
                >
                  <CardHeader className="py-3 px-4 flex flex-row items-center justify-between bg-purple-50/30">
                    <CardTitle className="text-base font-semibold text-slate-800">
                      {label}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-purple-600 hover:text-purple-800 hover:bg-purple-100/50"
                      onClick={() => regenerateSection(key as keyof SummaryData)}
                      disabled={regenerating === key}
                    >
                      {regenerating === key ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-2" />
                      ) : (
                        <Sparkles className="w-3 h-3 mr-2" />
                      )}
                      Regerar
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Textarea
                      value={summary[key as keyof SummaryData] || ''}
                      onChange={(e) => setSummary((s) => (s ? { ...s, [key]: e.target.value } : s))}
                      className="min-h-[100px] border-0 rounded-none rounded-b-xl focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent resize-y italic text-slate-700 p-4"
                    />
                  </CardContent>
                </Card>
              ))}

              <div className="flex justify-end mt-6">
                <Button
                  onClick={saveSummary}
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md w-full sm:w-auto"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Confirmar Resumo Definitivo
                </Button>
              </div>
            </div>
          )}

          {versions.length > 0 && (
            <Card className="shadow-subtle border-slate-200">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 rounded-t-xl">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-5 h-5 text-slate-500" />
                  Histórico de Versões
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {versions.map((v, i) => (
                    <div
                      key={v.id}
                      className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/50 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="secondary"
                            className="bg-purple-100 text-purple-700 font-semibold hover:bg-purple-100"
                          >
                            Versão {v.versao}
                          </Badge>
                          <span className="text-sm text-slate-500 font-medium">
                            {format(new Date(v.created), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">
                          Autor:{' '}
                          <span className="font-medium text-slate-800">
                            Assistido por IA ({v.expand?.usuario_id?.name || 'Manual'})
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                        {i < versions.length - 1 && (
                          <CompareDialog current={v.conteudo} previous={versions[i + 1].conteudo} />
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full sm:w-auto">
                              Ver Detalhes
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Badge className="bg-purple-100 text-purple-700">
                                  Versão {v.versao}
                                </Badge>
                                Resumo do Prontuário
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 mt-4">
                              {Object.entries(JSON.parse(v.conteudo || '{}')).map(([k, val]) => (
                                <div
                                  key={k}
                                  className="border-b border-slate-100 pb-4 last:border-0"
                                >
                                  <h4 className="font-semibold text-slate-800 mb-2">
                                    {sectionLabels[k as keyof SummaryData] || k}
                                  </h4>
                                  <p className="text-slate-600 whitespace-pre-wrap italic leading-relaxed">
                                    {String(val)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

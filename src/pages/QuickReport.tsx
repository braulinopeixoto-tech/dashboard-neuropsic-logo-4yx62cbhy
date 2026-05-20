import { useCallback, useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  AlertTriangle,
  CheckCircle,
  FileText,
  PlusCircle,
  Brain,
  ShieldAlert,
  FileBarChart,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Skeleton } from '@/components/ui/skeleton'
import { generateQuickReport } from '@/quick-report/engine'
import type { QuickReportOutput } from '@/quick-report/types'
import { parseNQL } from '@/quick-report/nql-parser'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'

const emptyForm = {
  paciente_id: '',
  titulo: '',
  profile: 'clinical' as const,
  nqlInput: '',
}

export default function QuickReport() {
  const { user } = useAuth()
  const [reports, setReports] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [generatedReport, setGeneratedReport] = useState<QuickReportOutput | null>(null)
  const [useTruncated, setUseTruncated] = useState(false)

  const truncateMarkdown = (markdown: string) => {
    let truncated = markdown.split('## 14. Limitacoes do relatorio')[0]
    if (truncated.length > 4900) {
      truncated = truncated.substring(0, 4900)
    }
    return (
      truncated.trim() + '\n\n*(Relatório truncado para caber no limite de caracteres do sistema)*'
    )
  }

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const [reportsList, patientsList] = await Promise.all([
        pb.collection('quick_reports').getFullList({ expand: 'paciente_id', sort: '-created' }),
        pb.collection('pacientes').getFullList({ filter: 'ativo=true', sort: 'nome' }),
      ])
      setReports(reportsList)
      setPatients(patientsList)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar Quick Reports.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const updateForm = (field: keyof typeof emptyForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleGeneratePreview = () => {
    if (!form.paciente_id || !form.nqlInput.trim()) {
      toast.error('Preencha o paciente e os dados NQL.')
      return
    }

    try {
      const patient = patients.find((p) => p.id === form.paciente_id)
      const input = parseNQL(form.nqlInput, patient)
      const report = generateQuickReport(input, { profile: form.profile as any })
      setGeneratedReport(report)
      setUseTruncated(false)
      toast.success('Relatório gerado e avaliado pelo Engine!')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao processar dados NQL. Verifique a sintaxe.')
    }
  }

  const handleCreateReport = async () => {
    if (!form.paciente_id || !form.titulo.trim() || !generatedReport) {
      toast.error('Preencha título e gere o relatório antes de salvar.')
      return
    }

    let finalMarkdown = generatedReport.reportMarkdown
    if (finalMarkdown.length > 5000) {
      if (useTruncated) {
        finalMarkdown = truncateMarkdown(finalMarkdown)
      } else {
        toast.error(
          'Relatório excede o limite de 5000 caracteres. Aceite truncar os anexos metodológicos.',
        )
        return
      }
    }

    try {
      setSaving(true)
      const payload: any = {
        paciente_id: form.paciente_id,
        titulo: form.titulo.trim(),
        conteudo: finalMarkdown,
      }

      if (user?.id) payload.usuario_id = user.id

      await pb.collection('quick_reports').create(payload)
      toast.success('Quick Report criado com sucesso.')
      setOpenCreateDialog(false)
      setForm(emptyForm)
      setGeneratedReport(null)
      await loadData(true)
    } catch (err) {
      console.error(err)
      toast.error('Não foi possível criar o Quick Report. Verifique as permissões da collection.')
    } finally {
      setSaving(false)
    }
  }

  const resetDialog = () => {
    setOpenCreateDialog(false)
    setGeneratedReport(null)
    setForm(emptyForm)
  }

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Quick Reports</h1>
          <p className="text-slate-500 mt-1">
            Engine de Relatórios Neurofuncionais Rápidos e Anotações Clínicas.
          </p>
        </div>
        <Button onClick={() => setOpenCreateDialog(true)}>
          <PlusCircle className="w-4 h-4 mr-2" /> Novo Report NQL
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.id} className="transition-all hover:shadow-md flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                <FileBarChart className="h-5 w-5 text-indigo-500" />
                {report.titulo}
              </CardTitle>
              <CardDescription>Paciente: {report.expand?.paciente_id?.nome}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="text-sm text-slate-600 line-clamp-4 relative overflow-hidden">
                <MarkdownRenderer content={report.conteudo} />
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />
              </div>
            </CardContent>
            <CardFooter className="pt-0 flex justify-between items-center text-xs text-slate-400">
              <span>{new Date(report.created).toLocaleString('pt-BR')}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  toast.info('A funcionalidade de visualização completa está em desenvolvimento.')
                }}
              >
                Ver Completo
              </Button>
            </CardFooter>
          </Card>
        ))}
        {reports.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 border rounded-lg border-dashed bg-white">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p>Nenhum Quick Report encontrado.</p>
          </div>
        )}
      </div>

      <Dialog open={openCreateDialog} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2 shrink-0 border-b">
            <DialogTitle>Gerar Quick Report NQL</DialogTitle>
            <DialogDescription>
              Escreva anotações usando blocos NQL (ex: [queixa], [qeeg]) para processamento
              analítico.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
            <div className="p-6 border-r overflow-y-auto space-y-4 bg-slate-50/50">
              <div className="space-y-2">
                <Label>Paciente</Label>
                <Select
                  value={form.paciente_id}
                  onValueChange={(value) => updateForm('paciente_id', value)}
                  disabled={patients.length === 0 || saving}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {patients.length === 0 && (
                  <p className="text-sm text-amber-600">
                    Cadastre um paciente ativo antes de criar um Quick Report.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quick-report-title">Título do Relatório</Label>
                <Input
                  id="quick-report-title"
                  value={form.titulo}
                  onChange={(event) => updateForm('titulo', event.target.value)}
                  disabled={saving}
                  placeholder="Ex.: Análise Neurofuncional Inicial"
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label>Perfil do Relatório</Label>
                <Select
                  value={form.profile}
                  onValueChange={(value) => updateForm('profile', value)}
                  disabled={saving}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clinical">Clínico (Padrão)</SelectItem>
                    <SelectItem value="family">Familiar (Acessível)</SelectItem>
                    <SelectItem value="legal">Jurídico (Pericial)</SelectItem>
                    <SelectItem value="school">Escolar (Adaptações)</SelectItem>
                    <SelectItem value="evolution">Evolução (Acompanhamento)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex flex-col h-full">
                <div className="flex justify-between items-center">
                  <Label htmlFor="quick-report-content">
                    Entrada NQL (Neurofunctional Quick Language)
                  </Label>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() =>
                        updateForm('nqlInput', form.nqlInput + '\n\n[qeeg]\n- Fp1 elevado teta')
                      }
                    >
                      + qEEG
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() =>
                        updateForm('nqlInput', form.nqlInput + '\n\n[source]\n- Cingulado Anterior')
                      }
                    >
                      + LORETA
                    </Button>
                  </div>
                </div>
                <Textarea
                  id="quick-report-content"
                  value={form.nqlInput}
                  onChange={(event) => updateForm('nqlInput', event.target.value)}
                  disabled={saving}
                  placeholder={`[queixa]\nDesatenção e hiperatividade\n\n[qeeg]\nFp1 elevado teta\n\n[psicometrico]\nBaixo desempenho executivo`}
                  className="min-h-[300px] font-mono text-sm bg-white resize-y flex-1"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Use os blocos NQL para estruturar o relatório: [queixa], [clinico],
                  [desenvolvimento], [escolar], [comportamento], [psicometrico], [qeeg], [source]
                </p>
              </div>

              <Button
                type="button"
                onClick={handleGeneratePreview}
                className="w-full"
                variant="secondary"
              >
                <Brain className="w-4 h-4 mr-2" />
                Processar Engine & Gerar Preview
              </Button>
            </div>

            <div className="p-6 overflow-y-auto bg-white">
              {generatedReport ? (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4 bg-slate-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4 text-indigo-500" />
                        <h4 className="font-semibold text-sm">Confiança Clínica</h4>
                      </div>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-2xl font-bold">
                          {generatedReport.clinicalConfidenceScore.score}
                        </span>
                        <span className="text-xs text-slate-500">/100</span>
                        <Badge
                          variant={
                            generatedReport.clinicalConfidenceScore.tier === 'high'
                              ? 'default'
                              : generatedReport.clinicalConfidenceScore.tier === 'moderate'
                                ? 'secondary'
                                : 'destructive'
                          }
                          className="ml-auto"
                        >
                          {generatedReport.clinicalConfidenceScore.tier.toUpperCase()}
                        </Badge>
                      </div>
                      <Progress
                        value={generatedReport.clinicalConfidenceScore.score}
                        className="h-2 mt-2"
                      />
                    </div>

                    <div
                      className={`border rounded-lg p-4 ${generatedReport.safetyGuard.passed ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldAlert
                          className={`w-4 h-4 ${generatedReport.safetyGuard.passed ? 'text-emerald-500' : 'text-rose-500'}`}
                        />
                        <h4 className="font-semibold text-sm">Safety Guard</h4>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        {generatedReport.safetyGuard.passed ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                            <span className="text-sm font-medium text-emerald-700">
                              Aprovado sem alertas
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-5 h-5 text-rose-500" />
                            <span className="text-sm font-medium text-rose-700">
                              Revisado com ressalvas
                            </span>
                          </>
                        )}
                      </div>
                      {generatedReport.safetyGuard.findings.length > 0 && (
                        <p className="text-xs text-slate-500 mt-2">
                          {generatedReport.safetyGuard.findings.length} correção(ões) de linguagem
                          clínica aplicadas.
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between border-b pb-2 mb-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-500" /> Preview do Relatório
                      </h3>
                      <div className="text-xs text-slate-500">
                        {useTruncated
                          ? truncateMarkdown(generatedReport.reportMarkdown).length
                          : generatedReport.reportMarkdown.length}{' '}
                        / 5000 chars
                      </div>
                    </div>

                    {generatedReport.reportMarkdown.length > 5000 && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium mb-1">
                              O relatório excede o limite de 5000 caracteres.
                            </p>
                            <label className="flex items-center gap-2 mt-2 cursor-pointer">
                              <input
                                type="checkbox"
                                className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                checked={useTruncated}
                                onChange={(e) => setUseTruncated(e.target.checked)}
                              />
                              <span>
                                Truncar seções de auditoria e limitações para salvar no prontuário.
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-4 border rounded-lg bg-slate-50/50 text-sm">
                      <MarkdownRenderer
                        content={
                          useTruncated
                            ? truncateMarkdown(generatedReport.reportMarkdown)
                            : generatedReport.reportMarkdown
                        }
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8">
                  <Brain className="w-12 h-12 mb-4 text-slate-200" />
                  <p className="text-sm">
                    Insira os dados no formato NQL e clique em "Processar Engine" para extrair
                    insights estruturados e visualizar o relatório.
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-4 border-t shrink-0 bg-slate-50">
            <Button type="button" variant="outline" onClick={resetDialog} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateReport}
              disabled={
                saving ||
                !generatedReport ||
                (generatedReport.reportMarkdown.length > 5000 && !useTruncated)
              }
            >
              {saving ? 'Salvando...' : 'Salvar no Prontuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

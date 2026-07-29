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
  Fingerprint,
  UserCheck,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { Skeleton } from '@/components/ui/skeleton'
import {
  generateQuickReport,
  type QuickReportInput,
  type QuickReportOutput,
  type ReportProfile,
} from '@/quick-report'
import { parseNQL } from '@/quick-report/nql-parser'
import { runQuickReportFromRawText } from '@/services/quick-report-engine-adapter'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'

type InputMode = 'raw' | 'nql'
type HumanReviewDecision = 'PENDING' | 'APPROVED' | 'REJECTED'

type QuickReportForm = {
  paciente_id: string
  titulo: string
  profile: ReportProfile
  inputMode: InputMode
  rawText: string
  nqlInput: string
}

const emptyForm: QuickReportForm = {
  paciente_id: '',
  titulo: '',
  profile: 'clinical',
  inputMode: 'raw',
  rawText: '',
  nqlInput: '',
}

export default function QuickReport() {
  const { user } = useAuth()
  const [reports, setReports] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [form, setForm] = useState<QuickReportForm>(emptyForm)
  const [generatedReport, setGeneratedReport] = useState<QuickReportOutput | null>(null)
  const [parsedInput, setParsedInput] = useState<QuickReportInput | null>(null)
  const [useTruncated, setUseTruncated] = useState(false)
  const [humanReviewDecision, setHumanReviewDecision] = useState<HumanReviewDecision>('PENDING')

  const truncateMarkdown = (markdown: string) => {
    let truncated = markdown.split('## 14. Limitacoes do relatorio')[0]
    if (truncated.length > 49000) {
      truncated = truncated.substring(0, 49000)
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

  const updateForm = <K extends keyof QuickReportForm>(field: K, value: QuickReportForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const clearGeneratedState = () => {
    setGeneratedReport(null)
    setParsedInput(null)
    setUseTruncated(false)
    setHumanReviewDecision('PENDING')
  }

  const handleGeneratePreview = () => {
    const activeText = form.inputMode === 'raw' ? form.rawText.trim() : form.nqlInput.trim()
    if (!activeText) {
      toast.error(
        form.inputMode === 'raw'
          ? 'Cole o texto bruto do relatório antes de gerar o preview.'
          : 'Preencha a entrada NQL manual antes de gerar o preview.',
      )
      return
    }

    try {
      let input: QuickReportInput
      let report: QuickReportOutput

      if (form.inputMode === 'raw') {
        const adapterResult = runQuickReportFromRawText(activeText, form.profile)
        input = adapterResult.parsedInput
        report = adapterResult.result
      } else {
        const patient = patients.find((p) => p.id === form.paciente_id)
        input = parseNQL(activeText, patient)
        report = generateQuickReport(input, { profile: form.profile })
      }

      console.log('NQL_PARSED_INPUT', input)
      console.log('NQL_REPORT_RESULT', report)
      setParsedInput(input)
      setGeneratedReport(report)
      setUseTruncated(false)
      setHumanReviewDecision('PENDING')
      toast.success('Relatório avançado gerado pelo pipeline NQL.')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao processar dados do Quick Report. Revise o texto de entrada.')
    }
  }

  const handleCreateReport = async () => {
    if (!form.paciente_id || !form.titulo.trim() || !generatedReport) {
      toast.error('Selecione paciente, informe título e gere o relatório antes de salvar.')
      return
    }
    if (humanReviewDecision !== 'APPROVED') {
      toast.error('A revisão humana deve aprovar o preview antes da persistência.')
      return
    }

    let finalMarkdown = generatedReport.reportMarkdown
    if (finalMarkdown.length > 50000) {
      if (useTruncated) {
        finalMarkdown = truncateMarkdown(finalMarkdown)
      } else {
        toast.error(
          'Relatório excede o limite de 50.000 caracteres. Aceite truncar os anexos metodológicos.',
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
      clearGeneratedState()
      await loadData(true)
    } catch (err: any) {
      console.error(err)

      const isMaxConstraintError =
        err?.response?.data?.conteudo?.code === 'validation_max_text_constraint' ||
        getErrorMessage(err).includes('maximum allowed length') ||
        getErrorMessage(err).includes('limite de caracteres')

      if (isMaxConstraintError) {
        toast.error(
          'Erro: O relatório excede o limite de caracteres permitido. Por favor, resuma o conteúdo ou entre em contato com o suporte.',
        )
      } else {
        const errorMsg = getErrorMessage(err)
        toast.error(`Erro ao salvar relatório: ${errorMsg}`)
      }
    } finally {
      setSaving(false)
    }
  }

  const resetDialog = () => {
    setOpenCreateDialog(false)
    setForm(emptyForm)
    clearGeneratedState()
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
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Quick Reports</h1>
            <Badge
              variant="secondary"
              className="border border-emerald-200 bg-emerald-50 text-emerald-700"
            >
              Quick Report Engine: NQL Advanced Pipeline Active
            </Badge>
          </div>
          <p className="text-slate-500 mt-1">
            Engine de Relatórios Neurofuncionais Rápidos com parser bruto, auditoria e Safety Guard.
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

      <Dialog
        open={openCreateDialog}
        onOpenChange={(open) => (open ? setOpenCreateDialog(true) : resetDialog())}
      >
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2 shrink-0 border-b">
            <DialogTitle>Gerar Quick Report Avançado</DialogTitle>
            <DialogDescription>
              Gere preview local sem paciente cadastrado. O paciente só é obrigatório para salvar no
              PocketBase e vincular ao prontuário.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
            <div className="p-6 border-r overflow-y-auto space-y-4 bg-slate-50/50">
              <div className="space-y-2">
                <Label>Paciente para vínculo ao salvar</Label>
                <Select
                  value={form.paciente_id}
                  onValueChange={(value) => updateForm('paciente_id', value)}
                  disabled={patients.length === 0 || saving}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Opcional para preview; obrigatório para salvar" />
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
                    Sem paciente ativo: o preview local continua liberado; salvar no PocketBase
                    permanece bloqueado.
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

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Perfil do Relatório</Label>
                  <Select
                    value={form.profile}
                    onValueChange={(value) => updateForm('profile', value as ReportProfile)}
                    disabled={saving}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clinical">Clínico</SelectItem>
                      <SelectItem value="family">Família/Paciente</SelectItem>
                      <SelectItem value="legal">Jurídico/Social</SelectItem>
                      <SelectItem value="school">Escola</SelectItem>
                      <SelectItem value="evolution">Evolução</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Modo de entrada</Label>
                  <Select
                    value={form.inputMode}
                    onValueChange={(value) => {
                      updateForm('inputMode', value as InputMode)
                      clearGeneratedState()
                    }}
                    disabled={saving}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Selecione o modo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="raw">Texto bruto</SelectItem>
                      <SelectItem value="nql">NQL manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {form.inputMode === 'raw' ? (
                <div className="space-y-2 flex flex-col h-full">
                  <Label htmlFor="quick-report-raw">Texto bruto do relatório</Label>
                  <Textarea
                    id="quick-report-raw"
                    value={form.rawText}
                    onChange={(event) => updateForm('rawText', event.target.value)}
                    disabled={saving}
                    placeholder="Cole aqui o relatório clínico completo, incluindo identificação, seções, qEEG e localização de fonte."
                    className="min-h-[340px] text-sm bg-white resize-y flex-1"
                  />
                  <p className="text-xs text-slate-500">
                    Fluxo: texto bruto -&gt; parseRawClinicalReport -&gt; generateQuickReport -&gt;
                    reportMarkdown.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 flex flex-col h-full">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="quick-report-nql">Entrada NQL manual</Label>
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
                          updateForm(
                            'nqlInput',
                            form.nqlInput + '\n\n[source]\n- Cingulado Anterior',
                          )
                        }
                      >
                        + LORETA
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    id="quick-report-nql"
                    value={form.nqlInput}
                    onChange={(event) => updateForm('nqlInput', event.target.value)}
                    disabled={saving}
                    placeholder={`[queixa]\nDesatenção e hiperatividade\n\n[qeeg]\nFp1 elevado teta\n\n[psicometrico]\nBaixo desempenho executivo`}
                    className="min-h-[340px] font-mono text-sm bg-white resize-y flex-1"
                  />
                  <p className="text-xs text-slate-500">
                    Use blocos NQL: [queixa], [clinico], [desenvolvimento], [escolar],
                    [comportamento], [psicometrico], [qeeg], [source].
                  </p>
                </div>
              )}

              <Button
                type="button"
                onClick={handleGeneratePreview}
                className="w-full"
                variant="secondary"
              >
                <Brain className="w-4 h-4 mr-2" />
                Gerar Relatório Avançado
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
                              Aprovado sem alertas críticos
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

                  {parsedInput && (
                    <div>
                      <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-slate-500" /> NQL Parsed Input
                      </h3>
                      <pre className="max-h-64 overflow-auto rounded-lg border bg-slate-950 p-4 text-xs text-slate-50">
                        {JSON.stringify(parsedInput, null, 2)}
                      </pre>
                    </div>
                  )}

                  <Card className="border-cyan-200 bg-cyan-50/40">
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Fingerprint className="h-4 w-4 text-cyan-700" />
                            AI Trust e revisão profissional
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Confira a trilha antes de autorizar a persistência no prontuário.
                          </CardDescription>
                        </div>
                        <Badge
                          variant={
                            humanReviewDecision === 'APPROVED'
                              ? 'default'
                              : humanReviewDecision === 'REJECTED'
                                ? 'destructive'
                                : 'secondary'
                          }
                        >
                          {humanReviewDecision === 'APPROVED'
                            ? 'APROVADO'
                            : humanReviewDecision === 'REJECTED'
                              ? 'REJEITADO'
                              : 'AGUARDANDO REVISÃO'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <dl className="grid gap-3 text-xs sm:grid-cols-2">
                        <div className="rounded-lg border bg-white p-3">
                          <dt className="font-semibold text-slate-500">Fingerprint do input</dt>
                          <dd className="mt-1 break-all font-mono text-slate-800">
                            {generatedReport.auditTrace.inputHash}
                          </dd>
                        </div>
                        <div className="rounded-lg border bg-white p-3">
                          <dt className="font-semibold text-slate-500">Versão do motor</dt>
                          <dd className="mt-1 font-medium text-slate-800">
                            {generatedReport.auditTrace.engineVersion}
                          </dd>
                        </div>
                        <div className="rounded-lg border bg-white p-3">
                          <dt className="font-semibold text-slate-500">Campos utilizados</dt>
                          <dd className="mt-1 text-slate-700">
                            {generatedReport.auditTrace.fieldsUsed.join(', ') || 'Nenhum'}
                          </dd>
                        </div>
                        <div className="rounded-lg border bg-white p-3">
                          <dt className="font-semibold text-slate-500">Campos ausentes</dt>
                          <dd className="mt-1 text-slate-700">
                            {generatedReport.auditTrace.fieldsMissing.join(', ') || 'Nenhum'}
                          </dd>
                        </div>
                      </dl>

                      <div className="grid gap-3 lg:grid-cols-2">
                        <div className="rounded-lg border bg-white p-3">
                          <p className="text-xs font-semibold text-slate-500">Limitações</p>
                          <ul className="mt-2 space-y-1 text-xs text-slate-700">
                            {generatedReport.auditTrace.limitations.map((limitation) => (
                              <li key={limitation}>• {limitation}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-lg border bg-white p-3">
                          <p className="text-xs font-semibold text-slate-500">
                            Trilha de inferência
                          </p>
                          <ul className="mt-2 space-y-1 text-xs text-slate-700">
                            {generatedReport.auditTrace.inferenceTrace.map((entry) => (
                              <li key={entry}>• {entry}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          onClick={() => {
                            setHumanReviewDecision('APPROVED')
                            toast.success('Preview aprovado para persistência pelo profissional.')
                          }}
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          Aprovar preview
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setHumanReviewDecision('REJECTED')
                            toast.info('Preview rejeitado. O conteúdo foi preservado para revisão.')
                          }}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Rejeitar e revisar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <div>
                    <div className="flex items-center justify-between border-b pb-2 mb-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-500" /> Preview do Relatório
                      </h3>
                      <div className="text-xs font-medium">
                        <span
                          className={
                            (useTruncated
                              ? truncateMarkdown(generatedReport.reportMarkdown).length
                              : generatedReport.reportMarkdown.length) > 50000
                              ? 'text-rose-500'
                              : (useTruncated
                                    ? truncateMarkdown(generatedReport.reportMarkdown).length
                                    : generatedReport.reportMarkdown.length) >= 40000
                                ? 'text-amber-500'
                                : 'text-slate-500'
                          }
                        >
                          {useTruncated
                            ? truncateMarkdown(generatedReport.reportMarkdown).length
                            : generatedReport.reportMarkdown.length}
                        </span>
                        <span className="text-slate-500"> / 50000 chars</span>
                      </div>
                    </div>

                    {generatedReport.reportMarkdown.length > 50000 && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium mb-1">
                              O relatório excede o limite de 50.000 caracteres.
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
                    Escolha Texto bruto ou NQL manual e clique em "Gerar Relatório Avançado" para
                    ver o parser, o engine e o Markdown final.
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
                !form.paciente_id ||
                !form.titulo.trim() ||
                !generatedReport ||
                humanReviewDecision !== 'APPROVED' ||
                (generatedReport.reportMarkdown.length > 50000 && !useTruncated)
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

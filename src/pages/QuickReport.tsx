import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { BrainCircuit, FileText, PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Skeleton } from '@/components/ui/skeleton'
import { runQuickReportFromRawText } from '@/services/quick-report-engine-adapter'
import type { QuickReportInput, QuickReportOutput, ReportProfile } from '@/quick-report'

const emptyForm = {
  paciente_id: '',
  titulo: '',
  conteudo: '',
}

const reportProfiles: Array<{ value: ReportProfile; label: string }> = [
  { value: 'clinical', label: 'Clinico tecnico' },
  { value: 'family', label: 'Familia/paciente' },
  { value: 'legal', label: 'Juridico/social' },
  { value: 'school', label: 'Escola' },
  { value: 'evolution', label: 'Evolucao' },
]

export default function QuickReport() {
  const { user } = useAuth()
  const [reports, setReports] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [selectedProfile, setSelectedProfile] = useState<ReportProfile>('clinical')
  const [advancedParsedInput, setAdvancedParsedInput] = useState<QuickReportInput | null>(null)
  const [advancedResult, setAdvancedResult] = useState<QuickReportOutput | null>(null)

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

  const openDialog = () => {
    setAdvancedParsedInput(null)
    setAdvancedResult(null)
    setOpenCreateDialog(true)
  }

  const handleGenerateAdvancedReport = () => {
    if (!form.conteudo.trim()) {
      toast.error('Cole o texto bruto do relatorio antes de gerar.')
      return
    }

    try {
      const { parsedInput, result } = runQuickReportFromRawText(form.conteudo, selectedProfile)
      console.log('NQL_PARSED_INPUT', parsedInput)
      console.log('NQL_REPORT_RESULT', result)
      setAdvancedParsedInput(parsedInput)
      setAdvancedResult(result)
      toast.success('Pipeline NQL executado com sucesso.')
    } catch (err) {
      console.error(err)
      toast.error('Nao foi possivel gerar o relatorio avancado.')
    }
  }

  const handleCreateReport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.paciente_id || !form.titulo.trim() || !form.conteudo.trim()) {
      toast.error('Preencha paciente, titulo e conteudo.')
      return
    }

    try {
      setSaving(true)
      const payload: any = {
        paciente_id: form.paciente_id,
        titulo: form.titulo.trim(),
        conteudo: advancedResult?.reportMarkdown || form.conteudo.trim(),
      }

      if (user?.id) payload.usuario_id = user.id

      await pb.collection('quick_reports').create(payload)
      toast.success('Quick Report criado com sucesso.')
      setOpenCreateDialog(false)
      setForm(emptyForm)
      setAdvancedParsedInput(null)
      setAdvancedResult(null)
      await loadData(true)
    } catch (err) {
      console.error(err)
      toast.error('Nao foi possivel criar o Quick Report. Verifique as permissoes da collection.')
    } finally {
      setSaving(false)
    }
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
      <div className="flex justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Quick Reports</h1>
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
              <BrainCircuit className="h-3.5 w-3.5" />
              Quick Report Engine: NQL Advanced Pipeline Active
            </span>
          </div>
          <p className="text-slate-500 mt-1">
            Texto bruto, extracao semantica, parser NQL e relatorio convergente auditavel.
          </p>
        </div>
        <Button onClick={openDialog}>
          <PlusCircle className="w-4 h-4 mr-2" /> Novo Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.id} className="transition-all hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                <FileText className="h-5 w-5 text-indigo-500" />
                {report.titulo}
              </CardTitle>
              <CardDescription>Paciente: {report.expand?.paciente_id?.nome}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 line-clamp-3 whitespace-pre-wrap">{report.conteudo}</p>
              <p className="text-xs text-slate-400 mt-4">
                {new Date(report.created).toLocaleString('pt-BR')}
              </p>
            </CardContent>
          </Card>
        ))}
        {reports.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 border rounded-lg border-dashed bg-white">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p>Nenhum Quick Report encontrado.</p>
          </div>
        )}
      </div>

      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Quick Report</DialogTitle>
            <DialogDescription>
              Cole um relatorio bruto para executar o parser NQL e gerar o markdown avancado.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateReport} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Paciente</Label>
                <Select
                  value={form.paciente_id}
                  onValueChange={(value) => updateForm('paciente_id', value)}
                  disabled={patients.length === 0 || saving}
                >
                  <SelectTrigger>
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
                    Cadastre um paciente ativo apenas se desejar salvar no PocketBase. O pipeline avancado pode ser testado sem paciente cadastrado.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Perfil de saida</Label>
                <Select
                  value={selectedProfile}
                  onValueChange={(value) => setSelectedProfile(value as ReportProfile)}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportProfiles.map((profile) => (
                      <SelectItem key={profile.value} value={profile.value}>
                        {profile.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-report-title">Titulo</Label>
              <Input
                id="quick-report-title"
                value={form.titulo}
                onChange={(event) => updateForm('titulo', event.target.value)}
                disabled={saving}
                placeholder="Ex.: Relatorio neurofuncional bruto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-report-content">Texto bruto do relatorio</Label>
              <Textarea
                id="quick-report-content"
                value={form.conteudo}
                onChange={(event) => {
                  updateForm('conteudo', event.target.value)
                  setAdvancedParsedInput(null)
                  setAdvancedResult(null)
                }}
                disabled={saving}
                placeholder="Cole aqui o relatorio bruto completo para extracao de identificacao, qEEG, source localization, risco e auditoria."
                className="min-h-[220px] font-mono text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleGenerateAdvancedReport}
                disabled={saving || !form.conteudo.trim()}
              >
                <BrainCircuit className="w-4 h-4 mr-2" />
                Gerar Relatorio Avancado
              </Button>
              {advancedResult && (
                <span className="text-sm text-emerald-700">
                  Safety Guard: {advancedResult.safetyGuard.passed ? 'aprovado' : 'com alertas'} | Score: {advancedResult.clinicalConfidenceScore.score}% | Risco: {advancedResult.riskLevel}
                </span>
              )}
            </div>

            {advancedParsedInput && (
              <div className="space-y-3 rounded-md border bg-slate-50 p-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">NQL Parsed Input</h3>
                  <pre className="mt-2 max-h-80 overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-100">
                    {JSON.stringify(advancedParsedInput, null, 2)}
                  </pre>
                </div>

                {advancedResult && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Relatorio Markdown Gerado</h3>
                    <div className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded border bg-white p-4 text-sm leading-6 text-slate-700">
                      {advancedResult.reportMarkdown}
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenCreateDialog(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || patients.length === 0}>
                {saving ? 'Salvando...' : 'Salvar Report'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

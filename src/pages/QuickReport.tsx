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
import { FileText, PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Skeleton } from '@/components/ui/skeleton'

const emptyForm = {
  paciente_id: '',
  titulo: '',
  conteudo: '',
}

export default function QuickReport() {
  const { user } = useAuth()
  const [reports, setReports] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [form, setForm] = useState(emptyForm)

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
        conteudo: form.conteudo.trim(),
      }

      if (user?.id) payload.usuario_id = user.id

      await pb.collection('quick_reports').create(payload)
      toast.success('Quick Report criado com sucesso.')
      setOpenCreateDialog(false)
      setForm(emptyForm)
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Quick Reports</h1>
          <p className="text-slate-500 mt-1">
            Anotacoes clinicas rapidas e observacoes do tratamento.
          </p>
        </div>
        <Button onClick={() => setOpenCreateDialog(true)}>
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
              <p className="text-sm text-slate-600 line-clamp-3">{report.conteudo}</p>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Quick Report</DialogTitle>
            <DialogDescription>
              Registre uma observacao clinica rapida vinculada a um paciente.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateReport} className="space-y-4">
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
                  Cadastre um paciente ativo antes de criar um Quick Report.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-report-title">Titulo</Label>
              <Input
                id="quick-report-title"
                value={form.titulo}
                onChange={(event) => updateForm('titulo', event.target.value)}
                disabled={saving}
                placeholder="Ex.: Observacao da sessao"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-report-content">Conteudo</Label>
              <Textarea
                id="quick-report-content"
                value={form.conteudo}
                onChange={(event) => updateForm('conteudo', event.target.value)}
                disabled={saving}
                placeholder="Descreva a observacao clinica..."
                className="min-h-[120px]"
              />
            </div>

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

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Stethoscope, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '@/hooks/use-auth'
import { createIntervencao } from '@/services/intervencoes'
import { useToast } from '@/hooks/use-toast'

export function TabIntervencoes({
  intervencoes,
  pacienteId,
}: {
  intervencoes: any[]
  pacienteId: string
}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const isNeuro = user?.tipo === 'neuropsicólogo'

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    tipo: '',
    descricao: '',
    data_intervencao: new Date().toISOString().slice(0, 16),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.tipo || !formData.descricao || !formData.data_intervencao) return

    setLoading(true)
    try {
      await createIntervencao({
        usuario_id: user.id,
        paciente_id: pacienteId,
        tipo: formData.tipo,
        descricao: formData.descricao,
        data_intervencao: new Date(formData.data_intervencao).toISOString(),
      })
      toast({ title: 'Sucesso', description: 'Intervenção registrada com sucesso!' })
      setOpen(false)
      setFormData({
        tipo: '',
        descricao: '',
        data_intervencao: new Date().toISOString().slice(0, 16),
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar a intervenção.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Registro de Intervenções</h3>
          <p className="text-sm text-slate-500 mt-1">Ações clínicas fora do protocolo padrão.</p>
        </div>
        {isNeuro && (
          <Button onClick={() => setOpen(true)} className="w-full sm:w-auto shrink-0 gap-1.5">
            <Plus className="w-4 h-4" /> Nova Intervenção
          </Button>
        )}
      </div>

      {intervencoes.length === 0 ? (
        <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-slate-100">
          Nenhuma intervenção registrada.
        </div>
      ) : (
        <div className="space-y-4">
          {intervencoes.map((int) => (
            <div
              key={int.id}
              className="p-4 rounded-lg border border-slate-100 bg-slate-50/50 flex flex-col gap-2"
            >
              <div className="flex justify-between items-start gap-4">
                <span className="font-medium text-slate-900 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-primary" /> {int.tipo}
                </span>
                <span className="text-xs text-slate-500 shrink-0">
                  {format(new Date(int.data_intervencao), 'dd/MM/yyyy HH:mm')}
                </span>
              </div>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{int.descricao}</p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Intervenção Clínica</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Intervenção</Label>
              <Select
                onValueChange={(v) => setFormData((p) => ({ ...p, tipo: v }))}
                value={formData.tipo}
              >
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Selecione o tipo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Contato telefônico">Contato telefônico</SelectItem>
                  <SelectItem value="Ajuste de protocolo">Ajuste de protocolo</SelectItem>
                  <SelectItem value="Reunião familiar">Reunião familiar</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="data">Data e Hora</Label>
              <Input
                id="data"
                type="datetime-local"
                value={formData.data_intervencao}
                onChange={(e) => setFormData((p) => ({ ...p, data_intervencao: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição / Observações</Label>
              <Textarea
                id="descricao"
                rows={4}
                placeholder="Descreva os detalhes da intervenção..."
                value={formData.descricao}
                onChange={(e) => setFormData((p) => ({ ...p, descricao: e.target.value }))}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Intervenção'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

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
import { MessageSquare, Plus } from 'lucide-react'
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
    <div className="bg-white rounded-xl border border-border p-5 shadow-subtle hover:shadow-elevation transition-all duration-200 space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-[16px] font-semibold text-slate-900">Registro de Intervenções</h3>
          <p className="text-[14px] font-normal text-slate-500 mt-1">
            Ações clínicas fora do protocolo padrão.
          </p>
        </div>
        {isNeuro && (
          <Button
            onClick={() => setOpen(true)}
            className="w-full sm:w-auto shrink-0 gap-1.5 transition-all duration-200"
          >
            <Plus className="w-4 h-4" /> Adicionar intervenção
          </Button>
        )}
      </div>

      {intervencoes.length === 0 ? (
        <div className="p-5 text-center text-slate-500 bg-slate-50 rounded-lg border border-border text-[14px] font-normal">
          Nenhuma intervenção
        </div>
      ) : (
        <div className="space-y-4">
          {intervencoes.map((int, index) => (
            <div
              key={int.id}
              className="p-5 rounded-lg border border-border bg-slate-50/50 flex flex-col gap-2 hover:shadow-subtle transition-all duration-200 animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-900 text-[16px] flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-primary" /> {int.tipo}
                  </span>
                  <span className="text-slate-400 hidden sm:inline">—</span>
                  <span className="text-[14px] font-normal text-slate-500">
                    {format(new Date(int.data_intervencao), 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
              </div>
              <p className="text-[14px] font-normal text-slate-600 whitespace-pre-wrap border-l-2 border-border pl-3 ml-2 mt-2 transition-all duration-200">
                {int.descricao}
              </p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] transition-all duration-200">
          <DialogHeader>
            <DialogTitle className="text-[24px] font-bold">
              Registrar Intervenção Clínica
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tipo" className="text-[14px] font-semibold">
                Tipo de Intervenção
              </Label>
              <Select
                onValueChange={(v) => setFormData((p) => ({ ...p, tipo: v }))}
                value={formData.tipo}
              >
                <SelectTrigger id="tipo" className="transition-all duration-200">
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
              <Label htmlFor="data" className="text-[14px] font-semibold">
                Data e Hora
              </Label>
              <Input
                id="data"
                type="datetime-local"
                value={formData.data_intervencao}
                onChange={(e) => setFormData((p) => ({ ...p, data_intervencao: e.target.value }))}
                required
                className="transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao" className="text-[14px] font-semibold">
                Descrição / Observações
              </Label>
              <Textarea
                id="descricao"
                rows={4}
                placeholder="Descreva os detalhes da intervenção..."
                value={formData.descricao}
                onChange={(e) => setFormData((p) => ({ ...p, descricao: e.target.value }))}
                required
                className="transition-all duration-200 font-normal"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="transition-all duration-200"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="transition-all duration-200">
                {loading ? 'Salvando...' : 'Salvar Intervenção'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

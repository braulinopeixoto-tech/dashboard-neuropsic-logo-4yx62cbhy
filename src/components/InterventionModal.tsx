import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createIntervencao } from '@/services/intervencoes'
import { marcarComoLido } from '@/services/alertas'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  alertaId: string
  pacienteId: string
}

export function InterventionModal({ open, onOpenChange, alertaId, pacienteId }: Props) {
  const { user } = useAuth()
  const [tipo, setTipo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!tipo || !descricao) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setLoading(true)
    try {
      await createIntervencao({
        usuario_id: user.id,
        paciente_id: pacienteId,
        tipo,
        descricao,
        data_intervencao: new Date().toISOString(),
      })

      await marcarComoLido(alertaId)
      toast.success('Intervenção registrada com sucesso!')
      onOpenChange(false)
      setTipo('')
      setDescricao('')
    } catch (e) {
      toast.error('Erro ao registrar intervenção')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Intervenção</DialogTitle>
          <DialogDescription>
            Registre a ação clínica tomada em resposta a este alerta.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="tipo">Tipo de Intervenção</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger id="tipo">
                <SelectValue placeholder="Selecione o tipo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Contato telefônico">Contato telefônico</SelectItem>
                <SelectItem value="Email">Email</SelectItem>
                <SelectItem value="Presencial">Presencial</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="descricao">Notas</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva a intervenção realizada..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar Intervenção'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

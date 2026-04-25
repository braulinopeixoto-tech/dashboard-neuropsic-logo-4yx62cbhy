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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { createIntervencao } from '@/services/intervencoes'
import { downgradeRiskLevel } from '@/services/cockpit'

export function InterveneNowModal({ riskScore, open, onOpenChange, onSuccess }: any) {
  const { user } = useAuth()
  const [tipo, setTipo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!tipo || !descricao) return toast.error('Preencha todos os campos obrigatórios')
    setLoading(true)
    try {
      await createIntervencao({
        usuario_id: user.id,
        paciente_id: riskScore.paciente_id,
        tipo,
        descricao,
        data_intervencao: new Date().toISOString(),
      })
      await downgradeRiskLevel(riskScore.id, riskScore.alert_level)
      toast.success('Intervenção registrada com sucesso.')
      onSuccess()
      onOpenChange(false)
      setTipo('')
      setDescricao('')
    } catch (e) {
      toast.error('Erro ao registrar intervenção')
    } finally {
      setLoading(false)
    }
  }

  if (!riskScore) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Intervenção Rápida</DialogTitle>
          <DialogDescription>Paciente: {riskScore.expand?.paciente_id?.nome}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Canal de Intervenção</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Contato telefônico">Contato telefônico</SelectItem>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                <SelectItem value="Presencial">Presencial</SelectItem>
                <SelectItem value="Remarcação automática">Remarcação automática</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Notas da Intervenção</Label>
            <Textarea
              placeholder="Descreva a ação..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="resize-none min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Salvando...' : 'Registrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

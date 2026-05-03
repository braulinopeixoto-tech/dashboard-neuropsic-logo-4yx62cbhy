import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { getRiskScoreByProtocol, updateVitalScore } from '@/services/risk_scores'
import { useAuth } from '@/hooks/use-auth'
import { Loader2, Activity } from 'lucide-react'

export function VitalScoreDialog({
  open,
  onOpenChange,
  pacienteId,
  protocoloId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  pacienteId: string
  protocoloId: string
}) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [score, setScore] = useState('')
  const [reason, setReason] = useState('')
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    if (open && protocoloId) {
      setLoading(true)
      getRiskScoreByProtocol(protocoloId).then((data) => {
        setScore(data?.performance_score?.toString() || '')
        setLoading(false)
      })
    }
  }, [open, protocoloId])

  const handleSave = async () => {
    if (!score || !user) return
    setSaving(true)
    try {
      await updateVitalScore(protocoloId, pacienteId, user.id, Number(score), reason)
      toast({
        description: 'Vital Score atualizado e registrado em auditoria',
      })
      onOpenChange(false)
      setReason('')
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar o Vital Score',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Atualizar Vital Score
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="score">Novo Valor do Vital Score (Performance)</Label>
              <Input
                id="score"
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="Ex: 85"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da Alteração</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Justifique a alteração do score"
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !score}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar e Auditar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { processarAiQueixa } from '@/services/anamneses'
import { useToast } from '@/hooks/use-toast'

export function QueixaSection({
  pacienteId,
  value,
  onChange,
}: {
  pacienteId: string
  value: any
  onChange: (v: any) => void
}) {
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleAI = async () => {
    if (!texto) return
    setLoading(true)
    try {
      const res = await processarAiQueixa(pacienteId, texto)
      onChange(res)
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Erro ao estruturar com IA. Tente novamente ou preencha manualmente.',
        variant: 'destructive',
      })
      onChange({
        sintoma_principal: '',
        duracao: '',
        intensidade: 0,
        fatores_desencadeadores: '',
        impacto_funcional: '',
      })
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: string, val: any) => onChange({ ...value, [field]: val })

  return (
    <Card className="p-5 space-y-4 shadow-sm">
      <div className="space-y-2">
        <Label>Descreva a queixa principal do paciente</Label>
        <Textarea
          rows={3}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Ex: Paciente relata dores de cabeça há três meses com impacto na rotina..."
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleAI} disabled={loading || !texto} className="flex-1 sm:flex-none">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Estruturar com IA
        </Button>
        {!value && (
          <Button
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={() =>
              onChange({
                sintoma_principal: '',
                duracao: '',
                intensidade: 0,
                fatores_desencadeadores: '',
                impacto_funcional: '',
              })
            }
          >
            Preencher Manualmente
          </Button>
        )}
      </div>

      {value && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 bg-slate-50/50 p-4 rounded-xl border border-slate-100 animate-fade-in-down">
          <div className="space-y-1">
            <Label className="text-slate-600">Sintoma Principal</Label>
            <Input
              value={value.sintoma_principal || ''}
              onChange={(e) => updateField('sintoma_principal', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-600">Duração</Label>
            <Input
              value={value.duracao || ''}
              onChange={(e) => updateField('duracao', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-600">Intensidade (0-10)</Label>
            <Input
              type="number"
              min={0}
              max={10}
              value={value.intensidade || ''}
              onChange={(e) => updateField('intensidade', Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-600">Fatores Desencadeadores</Label>
            <Input
              value={value.fatores_desencadeadores || ''}
              onChange={(e) => updateField('fatores_desencadeadores', e.target.value)}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-slate-600">Impacto Funcional</Label>
            <Input
              value={value.impacto_funcional || ''}
              onChange={(e) => updateField('impacto_funcional', e.target.value)}
            />
          </div>
        </div>
      )}
    </Card>
  )
}

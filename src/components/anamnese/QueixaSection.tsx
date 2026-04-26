import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { processarAiQueixa } from '@/services/anamneses'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export function QueixaSection({
  pacienteId,
  data,
  onChange,
}: {
  pacienteId: string
  data: { raw: string; struct: any }
  onChange: (v: { raw: string; struct: any }) => void
}) {
  const [loading, setLoading] = useState(false)
  const [isAiGenerated, setIsAiGenerated] = useState(!!data.struct)
  const { toast } = useToast()

  const setTexto = (val: string) => onChange({ ...data, raw: val })

  const handleAI = async () => {
    if (!data.raw) return
    setLoading(true)
    try {
      const res = await processarAiQueixa(pacienteId, data.raw)
      onChange({ ...data, struct: res })
      setIsAiGenerated(true)
      toast({ description: '✅ Anamnese estruturada com sucesso!' })
    } catch (e) {
      toast({
        description: '❌ Erro ao estruturar com IA. Tente novamente ou preencha manualmente.',
        variant: 'destructive',
      })
      onChange({
        ...data,
        struct: {
          sintoma_principal: '',
          duracao: '',
          intensidade: 0,
          fatores_desencadeadores: '',
          impacto_funcional: '',
        },
      })
      setIsAiGenerated(false)
    } finally {
      setLoading(false)
    }
  }

  const handleManual = () => {
    onChange({
      ...data,
      struct: {
        sintoma_principal: '',
        duracao: '',
        intensidade: 0,
        fatores_desencadeadores: '',
        impacto_funcional: '',
      },
    })
    setIsAiGenerated(false)
  }

  const updateField = (field: string, val: any) => {
    onChange({ ...data, struct: { ...data.struct, [field]: val } })
  }

  const inputClassName = cn(
    'text-[14px] font-normal',
    isAiGenerated && 'italic text-ai border-ai/30 bg-ai/5',
  )

  return (
    <Card className="p-[20px] space-y-4 shadow-sm">
      <div className="space-y-4">
        <Label className="text-[16px] font-semibold">Descreva a queixa principal do paciente</Label>
        <Textarea
          rows={3}
          value={data.raw}
          className="text-[14px] font-normal"
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Ex: Paciente relata dores de cabeça há três meses com impacto na rotina..."
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <Button
          onClick={handleAI}
          disabled={loading || !data.raw}
          className="flex-1 sm:flex-none bg-ai/10 text-ai hover:bg-ai/20 border border-ai/20 hover:shadow-elevation hover:-translate-y-0.5 transition-all duration-300 text-[14px] font-semibold"
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin text-ai" /> : '🤖 '}
          {loading ? 'IA estruturando...' : 'Estruturar com IA'}
        </Button>
        {!data.struct && (
          <Button
            variant="outline"
            className="flex-1 sm:flex-none text-[14px] font-normal hover:shadow-elevation hover:-translate-y-0.5 transition-all duration-300"
            onClick={handleManual}
          >
            ✏️ Preencher Manualmente
          </Button>
        )}
      </div>

      {data.struct && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 bg-slate-50/50 p-[20px] rounded-xl border border-slate-100 animate-slide-up duration-300">
          <div className="space-y-2">
            <Label className="text-[16px] font-semibold text-slate-600">Sintoma Principal</Label>
            <Input
              className={inputClassName}
              value={data.struct.sintoma_principal || ''}
              onChange={(e) => updateField('sintoma_principal', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[16px] font-semibold text-slate-600">Duração</Label>
            <Input
              className={inputClassName}
              value={data.struct.duracao || ''}
              onChange={(e) => updateField('duracao', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[16px] font-semibold text-slate-600">Intensidade (0-10)</Label>
            <Input
              type="number"
              min={0}
              max={10}
              className={inputClassName}
              value={data.struct.intensidade || ''}
              onChange={(e) => updateField('intensidade', Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[16px] font-semibold text-slate-600">
              Fatores Desencadeadores
            </Label>
            <Input
              className={inputClassName}
              value={data.struct.fatores_desencadeadores || ''}
              onChange={(e) => updateField('fatores_desencadeadores', e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-[16px] font-semibold text-slate-600">Impacto Funcional</Label>
            <Input
              className={inputClassName}
              value={data.struct.impacto_funcional || ''}
              onChange={(e) => updateField('impacto_funcional', e.target.value)}
            />
          </div>
        </div>
      )}
    </Card>
  )
}

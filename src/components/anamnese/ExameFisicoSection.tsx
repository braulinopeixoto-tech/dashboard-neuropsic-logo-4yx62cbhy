import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export function ExameFisicoSection({
  value,
  onChange,
}: {
  value: any
  onChange: (v: any) => void
}) {
  const update = (f: string, v: any) => onChange({ ...value, [f]: v })

  const imc = useMemo(() => {
    const w = parseFloat(value.peso)
    const h = parseFloat(value.altura) / 100
    return w > 0 && h > 0 ? (w / (h * h)).toFixed(1) : ''
  }, [value.peso, value.altura])

  return (
    <Card className="p-5 space-y-6 shadow-sm">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
        <div className="space-y-1.5">
          <Label className="text-slate-600">Pressão (mmHg)</Label>
          <Input
            placeholder="120/80"
            value={value.pa || ''}
            onChange={(e) => update('pa', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-600">Freq. Cardíaca (bpm)</Label>
          <Input
            type="number"
            placeholder="80"
            value={value.fc || ''}
            onChange={(e) => update('fc', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-600">Freq. Respiratória</Label>
          <Input
            type="number"
            placeholder="16"
            value={value.fr || ''}
            onChange={(e) => update('fr', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-600">Temperatura (°C)</Label>
          <Input
            type="number"
            step="0.1"
            placeholder="36.5"
            value={value.temp || ''}
            onChange={(e) => update('temp', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-600">Peso (kg)</Label>
          <Input
            type="number"
            step="0.1"
            placeholder="70"
            value={value.peso || ''}
            onChange={(e) => update('peso', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-600">Altura (cm)</Label>
          <Input
            type="number"
            placeholder="170"
            value={value.altura || ''}
            onChange={(e) => update('altura', e.target.value)}
          />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label className="text-slate-600">IMC Calculado</Label>
          <Input disabled value={imc} className="bg-white font-semibold text-slate-800" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Exame Neurológico</Label>
          <Textarea
            rows={4}
            placeholder="Reflexos, coordenação, força muscular..."
            value={value.neuro || ''}
            onChange={(e) => update('neuro', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Exame Psíquico</Label>
          <Textarea
            rows={4}
            placeholder="Consciência, orientação, memória, afeto..."
            value={value.psiquico || ''}
            onChange={(e) => update('psiquico', e.target.value)}
          />
        </div>
      </div>
    </Card>
  )
}

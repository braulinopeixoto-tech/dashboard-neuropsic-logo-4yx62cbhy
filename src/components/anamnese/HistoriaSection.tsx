import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, X } from 'lucide-react'
import { processarAiResumo } from '@/services/anamneses'
import { useToast } from '@/hooks/use-toast'

function DynamicList({
  items,
  onChange,
  placeholder,
}: {
  items: string[]
  onChange: (v: string[]) => void
  placeholder: string
}) {
  const [val, setVal] = useState('')
  const add = () => {
    if (val.trim()) {
      onChange([...items, val.trim()])
      setVal('')
    }
  }
  return (
    <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
      <div className="flex gap-2">
        <Input
          className="bg-white"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder={placeholder}
        />
        <Button type="button" variant="secondary" onClick={add}>
          Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <Badge key={i} variant="outline" className="bg-white pl-2 pr-1 py-1 gap-1">
            {item}{' '}
            <div
              className="p-0.5 rounded-full hover:bg-slate-100 cursor-pointer"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            >
              <X className="w-3 h-3 text-slate-500" />
            </div>
          </Badge>
        ))}
      </div>
    </div>
  )
}

export function HistoriaSection({
  pacienteId,
  value,
  onChange,
}: {
  pacienteId: string
  value: string
  onChange: (v: string) => void
}) {
  const [data, setData] = useState({
    pessoais: '',
    familiares: '',
    medicacoes: [] as string[],
    alergias: [] as string[],
    cirurgias: [] as string[],
    traumas: '',
    perdas: '',
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleAI = async () => {
    setLoading(true)
    try {
      const res = await processarAiResumo(pacienteId, data)
      onChange(res.resumo)
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Erro ao resumir com IA. Preencha manualmente.',
        variant: 'destructive',
      })
      if (!value) onChange(' ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-5 space-y-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        <div className="space-y-2">
          <Label>Antecedentes Pessoais</Label>
          <Textarea
            rows={3}
            value={data.pessoais}
            onChange={(e) => setData({ ...data, pessoais: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Antecedentes Familiares</Label>
          <Textarea
            rows={3}
            value={data.familiares}
            onChange={(e) => setData({ ...data, familiares: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Medicações Atuais</Label>
          <DynamicList
            items={data.medicacoes}
            onChange={(v) => setData({ ...data, medicacoes: v })}
            placeholder="Ex: Losartana 50mg"
          />
        </div>
        <div className="space-y-2">
          <Label>Alergias</Label>
          <DynamicList
            items={data.alergias}
            onChange={(v) => setData({ ...data, alergias: v })}
            placeholder="Ex: Penicilina"
          />
        </div>
        <div className="space-y-2">
          <Label>Cirurgias Anteriores</Label>
          <DynamicList
            items={data.cirurgias}
            onChange={(v) => setData({ ...data, cirurgias: v })}
            placeholder="Ex: Apendicectomia (2015)"
          />
        </div>
        <div className="space-y-2">
          <Label>Traumas</Label>
          <Textarea
            rows={2}
            value={data.traumas}
            onChange={(e) => setData({ ...data, traumas: e.target.value })}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Perdas Recentes</Label>
          <Textarea
            rows={2}
            value={data.perdas}
            onChange={(e) => setData({ ...data, perdas: e.target.value })}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={handleAI} disabled={loading} className="flex-1 sm:flex-none">
          <Loader2 className={loading ? 'w-4 h-4 mr-2 animate-spin' : 'hidden'} /> Resumir com IA
        </Button>
        {!value && (
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => onChange(' ')}>
            Preencher Manualmente
          </Button>
        )}
      </div>

      {value ? (
        <div className="mt-6 space-y-2 border-t border-slate-100 pt-6 animate-fade-in-down">
          <Label className="text-base text-slate-800">Resumo Narrativo Gerado</Label>
          <Textarea
            className="min-h-[120px] text-base leading-relaxed"
            value={value.trim()}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      ) : null}
    </Card>
  )
}

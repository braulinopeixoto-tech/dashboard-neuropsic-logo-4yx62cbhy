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
import { cn } from '@/lib/utils'

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
    <div className="space-y-4 bg-slate-50 p-[20px] rounded-lg border border-slate-100">
      <div className="flex gap-4">
        <Input
          className="bg-white text-[14px] font-normal"
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
        <Button
          type="button"
          variant="secondary"
          className="text-[14px] font-semibold"
          onClick={add}
        >
          Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <Badge
            key={i}
            variant="outline"
            className="bg-white pl-2 pr-1 py-1 gap-1 text-[14px] font-normal"
          >
            {item}{' '}
            <div
              className="p-0.5 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
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
  data,
  onChange,
}: {
  pacienteId: string
  data: { raw: any; resumo: string }
  onChange: (v: { raw: any; resumo: string }) => void
}) {
  const [loading, setLoading] = useState(false)
  const [isAiGenerated, setIsAiGenerated] = useState(!!data.resumo)
  const { toast } = useToast()

  const updateRaw = (field: string, val: any) => {
    onChange({ ...data, raw: { ...data.raw, [field]: val } })
  }

  const handleAI = async () => {
    setLoading(true)
    try {
      const res = await processarAiResumo(pacienteId, data.raw)
      onChange({ ...data, resumo: res.resumo })
      setIsAiGenerated(true)
      toast({ description: '✅ História resumida com sucesso!' })
    } catch (e) {
      toast({
        description: '❌ Erro ao resumir com IA. Tente novamente ou preencha manualmente.',
        variant: 'destructive',
      })
      if (!data.resumo) {
        onChange({ ...data, resumo: ' ' })
        setIsAiGenerated(false)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-[20px] space-y-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
        <div className="space-y-4">
          <Label className="text-[16px] font-semibold">Antecedentes Pessoais</Label>
          <Textarea
            rows={3}
            className="text-[14px] font-normal"
            value={data.raw.pessoais}
            onChange={(e) => updateRaw('pessoais', e.target.value)}
          />
        </div>
        <div className="space-y-4">
          <Label className="text-[16px] font-semibold">Antecedentes Familiares</Label>
          <Textarea
            rows={3}
            className="text-[14px] font-normal"
            value={data.raw.familiares}
            onChange={(e) => updateRaw('familiares', e.target.value)}
          />
        </div>
        <div className="space-y-4">
          <Label className="text-[16px] font-semibold">Medicações Atuais</Label>
          <DynamicList
            items={data.raw.medicacoes}
            onChange={(v) => updateRaw('medicacoes', v)}
            placeholder="Ex: Losartana 50mg"
          />
        </div>
        <div className="space-y-4">
          <Label className="text-[16px] font-semibold">Alergias</Label>
          <DynamicList
            items={data.raw.alergias}
            onChange={(v) => updateRaw('alergias', v)}
            placeholder="Ex: Penicilina"
          />
        </div>
        <div className="space-y-4">
          <Label className="text-[16px] font-semibold">Cirurgias Anteriores</Label>
          <DynamicList
            items={data.raw.cirurgias}
            onChange={(v) => updateRaw('cirurgias', v)}
            placeholder="Ex: Apendicectomia (2015)"
          />
        </div>
        <div className="space-y-4">
          <Label className="text-[16px] font-semibold">Traumas</Label>
          <Textarea
            rows={2}
            className="text-[14px] font-normal"
            value={data.raw.traumas}
            onChange={(e) => updateRaw('traumas', e.target.value)}
          />
        </div>
        <div className="space-y-4 md:col-span-2">
          <Label className="text-[16px] font-semibold">Perdas Recentes</Label>
          <Textarea
            rows={2}
            className="text-[14px] font-normal"
            value={data.raw.perdas}
            onChange={(e) => updateRaw('perdas', e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-4 pt-2">
        <Button
          onClick={handleAI}
          disabled={loading}
          className="flex-1 sm:flex-none bg-ai/10 text-ai hover:bg-ai/20 border border-ai/20 hover:shadow-elevation hover:-translate-y-0.5 transition-all duration-300 text-[14px] font-semibold"
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin text-ai" /> : '🤖 '}
          {loading ? 'IA resumindo...' : 'Resumir com IA'}
        </Button>
        {!data.resumo && (
          <Button
            variant="outline"
            className="flex-1 sm:flex-none text-[14px] font-normal hover:shadow-elevation hover:-translate-y-0.5 transition-all duration-300"
            onClick={() => {
              onChange({ ...data, resumo: ' ' })
              setIsAiGenerated(false)
            }}
          >
            ✏️ Preencher Manualmente
          </Button>
        )}
      </div>

      {data.resumo ? (
        <div className="mt-6 space-y-4 border-t border-slate-100 pt-6 animate-slide-up duration-300">
          <Label className="text-[16px] font-semibold text-slate-800">
            Resumo Narrativo Gerado
          </Label>
          <Textarea
            className={cn(
              'min-h-[120px] text-[14px] leading-relaxed',
              isAiGenerated ? 'italic text-ai font-normal border-ai/30 bg-ai/5' : 'font-normal',
            )}
            value={data.resumo.trim()}
            onChange={(e) => onChange({ ...data, resumo: e.target.value })}
          />
        </div>
      ) : null}
    </Card>
  )
}

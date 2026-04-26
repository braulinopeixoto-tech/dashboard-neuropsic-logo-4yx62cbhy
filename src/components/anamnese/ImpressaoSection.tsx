import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { processarAiImpressao } from '@/services/anamneses'
import { useToast } from '@/hooks/use-toast'

export function ImpressaoSection({
  pacienteId,
  context,
  value,
  onChange,
}: {
  pacienteId: string
  context: any
  value: string
  onChange: (v: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleAI = async () => {
    setLoading(true)
    try {
      const res = await processarAiImpressao(pacienteId, context)
      onChange(res.impressao)
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Erro ao gerar com IA. Preencha manualmente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-5 shadow-sm space-y-4 bg-gradient-to-br from-white to-slate-50/50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <Label className="text-base text-slate-800">Impressão Clínica Preliminar</Label>
        <Button onClick={handleAI} disabled={loading} variant="default" className="shadow-sm">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Gerar Síntese com IA
        </Button>
      </div>
      <Textarea
        rows={8}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="A síntese agregará queixa principal, resumos históricos e exames para criar um quadro descritivo. Pressione o botão acima para gerar, ou redija manualmente."
        className="text-base leading-relaxed bg-white"
      />
    </Card>
  )
}

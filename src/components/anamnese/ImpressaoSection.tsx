import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { processarAiImpressao } from '@/services/anamneses'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

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
  const [isAiGenerated, setIsAiGenerated] = useState(false)
  const { toast } = useToast()

  const handleAI = async () => {
    setLoading(true)
    try {
      const res = await processarAiImpressao(pacienteId, context)
      onChange(res.impressao)
      setIsAiGenerated(true)
      toast({ description: '✅ Impressão gerada com sucesso!' })
    } catch (e) {
      toast({
        description: '❌ Erro ao gerar com IA. Preencha manualmente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleManualChange = (val: string) => {
    onChange(val)
  }

  return (
    <Card className="p-[20px] shadow-sm space-y-4 bg-gradient-to-br from-white to-slate-50/50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <Label className="text-[16px] font-semibold text-slate-800">
          Impressão Clínica Preliminar
        </Label>
        <Button
          onClick={handleAI}
          disabled={loading}
          className="bg-ai/10 text-ai hover:bg-ai/20 border border-ai/20 hover:shadow-elevation hover:-translate-y-0.5 transition-all duration-300 text-[14px] font-semibold shadow-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin text-ai" /> : '🤖 '}
          {loading ? 'Gerando...' : 'Gerar Síntese com IA'}
        </Button>
      </div>
      <div
        className={cn(
          'transition-all duration-300',
          value && isAiGenerated ? 'animate-slide-up' : '',
        )}
      >
        <Textarea
          rows={8}
          value={value}
          onChange={(e) => handleManualChange(e.target.value)}
          placeholder="A síntese agregará queixa principal, resumos históricos e exames para criar um quadro descritivo. Pressione o botão acima para gerar, ou redija manualmente."
          className={cn(
            'text-[14px] leading-relaxed bg-white',
            isAiGenerated && value
              ? 'italic text-ai font-normal border-ai/30 bg-ai/5'
              : 'font-normal',
          )}
        />
      </div>
    </Card>
  )
}

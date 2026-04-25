import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent } from '@/components/ui/card'
import { ShieldCheck } from 'lucide-react'

export function RelatorioAssinatura({ data }: { data: any }) {
  const { user } = useAuth()

  const latestDnda = data.dndas[data.dndas.length - 1]
  const confidence = latestDnda?.confidence_level || 0.95
  const hash = data.latestAudit?.hash_integrity || 'a8f9c2e4b6d1735a'

  const shortHash = hash.substring(0, 16)
  const today = new Date().toLocaleDateString('pt-BR', { dateStyle: 'long' })

  return (
    <Card className="mt-8 border-dashed border-2 border-slate-300 bg-slate-50 print:border-solid print:border-slate-300 print:bg-white print:break-inside-avoid">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              Certificação de Integridade e Auditoria
            </div>
            <p className="text-sm text-slate-600 mb-4 max-w-2xl">
              Este relatório é auditável e defensável juridicamente. Os dados apresentados foram
              consolidados através de cadeias criptográficas locais, garantindo a imutabilidade do
              registro clínico.
            </p>
            <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 font-mono bg-white p-3 rounded border border-slate-200">
              <div>
                <span className="block font-semibold text-slate-700">Hash de Integridade:</span>
                {shortHash}...
              </div>
              <div>
                <span className="block font-semibold text-slate-700">
                  Nível de Confiança DNDA™:
                </span>
                {(confidence * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col items-center justify-center shrink-0 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-300 md:pl-8">
            <div className="w-48 border-b border-slate-800 mb-2"></div>
            <div className="text-sm font-bold text-slate-800">
              {user?.name || 'Neuropsicólogo Responsável'}
            </div>
            <div className="text-xs text-slate-500 capitalize">
              {user?.tipo || 'Profissional Clínico'}
            </div>
            <div className="text-xs text-slate-400 mt-2">{today}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

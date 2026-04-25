import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getRelatorioData } from '@/services/relatorio'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Printer, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

import { RelatorioTimeline } from '@/components/relatorio/RelatorioTimeline'
import { RelatorioNarrativa } from '@/components/relatorio/RelatorioNarrativa'
import { RelatorioDnda } from '@/components/relatorio/RelatorioDnda'
import { RelatorioIndicadores } from '@/components/relatorio/RelatorioIndicadores'
import { RelatorioAssinatura } from '@/components/relatorio/RelatorioAssinatura'

export default function RelatorioFinal() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadData = async () => {
    if (!id) return
    try {
      const res = await getRelatorioData(id)
      setData(res)
      setError(false)
    } catch (err) {
      console.error(err)
      setError(true)
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o relatório.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  useRealtime('dnda_schema', () => loadData())
  useRealtime('risk_score', () => loadData())

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !data?.paciente) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">
          Nenhum dado encontrado para gerar o relatório ou erro ao carregar.
        </p>
        <Button onClick={loadData}>Tentar Novamente</Button>
      </div>
    )
  }

  return (
    <div className="max-w-[1000px] mx-auto pb-12 animate-fade-in">
      {/* Non-printable header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 print:hidden">
        <Button variant="ghost" className="gap-2 -ml-4 text-slate-500 hover:text-slate-900" asChild>
          <Link to={`/pacientes/${id}`}>
            <ArrowLeft className="w-4 h-4" /> Voltar ao Paciente
          </Link>
        </Button>
        <Button onClick={handlePrint} className="gap-2 shadow-sm">
          <Printer className="w-4 h-4" /> Exportar PDF
        </Button>
      </div>

      {/* Printable Area Wrapper */}
      <div
        id="relatorio-print-area"
        className="bg-white md:p-8 md:border md:border-slate-200 md:rounded-xl md:shadow-sm print:p-0 print:border-none print:shadow-none"
      >
        {/* Report Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-6 mb-8 print:pb-4 print:mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mb-1">
              Relatório Final — {data.paciente.nome}
            </h1>
            <p className="text-slate-500 text-sm">
              Documento Consolidado de Evolução Neurofuncional e Clínica
            </p>
          </div>
          <div className="mt-4 md:mt-0 hidden md:block print:block">
            <img
              src="https://img.usecurling.com/i?q=brain%20clinic&shape=outline&color=solid-black"
              alt="Clinic Logo"
              className="h-12 w-auto opacity-80"
            />
          </div>
        </div>

        <RelatorioIndicadores data={data} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:block print:space-y-8">
          <div className="space-y-8">
            <RelatorioNarrativa data={data} />
            <RelatorioDnda dndas={data.dndas} />
          </div>
          <div>
            <RelatorioTimeline data={data} />
          </div>
        </div>

        <RelatorioAssinatura data={data} />
      </div>
    </div>
  )
}

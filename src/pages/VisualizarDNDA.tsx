import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { DndaReportView } from '@/components/dnda/DndaReportView'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function VisualizarDNDA() {
  const { id, dndaId } = useParams()
  const navigate = useNavigate()
  const [dndas, setDndas] = useState<any[]>([])
  const [paciente, setPaciente] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(false)
        const p = await pb.collection('pacientes').getOne(id as string)
        setPaciente(p)

        const allDndas = await pb
          .collection('dnda')
          .getFullList({ filter: `paciente_id="${id}"`, sort: '-created' })

        const specificIndex = allDndas.findIndex((d) => d.id === dndaId)
        let orderedDndas = allDndas

        if (specificIndex > 0) {
          const specific = allDndas[specificIndex]
          const rest = allDndas.filter((_, idx) => idx !== specificIndex)
          orderedDndas = [specific, ...rest]
        }

        setDndas(orderedDndas)
      } catch (e) {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    if (id) load()
  }, [id, dndaId])

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full bg-white shadow-sm border border-slate-200"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Visualizar DNDA™</h1>
          <p className="text-sm text-slate-500">Relatório clínico e neurofuncional</p>
        </div>
      </div>
      <DndaReportView paciente={paciente} dndas={dndas} loading={loading} error={error} />
    </div>
  )
}

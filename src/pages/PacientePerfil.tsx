import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { getPaciente, getProtocolos, getSessoes } from '@/services/pacientes'
import { getIntervencoes } from '@/services/intervencoes'
import { ArrowLeft } from 'lucide-react'

import { PacienteHeader } from '@/components/paciente/PacienteHeader'
import { TabProtocolo } from '@/components/paciente/TabProtocolo'
import { TabHistorico } from '@/components/paciente/TabHistorico'
import { TabIntervencoes } from '@/components/paciente/TabIntervencoes'

export default function PacientePerfil() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()

  const [paciente, setPaciente] = useState<any>(null)
  const [protocolos, setProtocolos] = useState<any[]>([])
  const [sessoes, setSessoes] = useState<any[]>([])
  const [intervencoes, setIntervencoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    if (!id) return
    try {
      const [pt, prots, sess, intervs] = await Promise.all([
        getPaciente(id),
        getProtocolos(id),
        getSessoes(id),
        getIntervencoes(id),
      ])
      setPaciente(pt)
      setProtocolos(prots)
      setSessoes(sess)
      setIntervencoes(intervs)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar perfil. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  useRealtime('sessoes', () => {
    if (id) getSessoes(id).then(setSessoes)
  })

  useRealtime('intervencoes', () => {
    if (id) getIntervencoes(id).then(setIntervencoes)
  })

  if (loading) {
    return (
      <div className="max-w-[1000px] mx-auto space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    )
  }

  if (!paciente) {
    return <div className="text-center py-12 text-slate-500">Paciente não encontrado.</div>
  }

  const protocoloAtual = protocolos.find((p) => p.status === 'ativo') || protocolos[0]

  return (
    <div className="max-w-[1000px] mx-auto space-y-8 animate-fade-in-up">
      <Button variant="ghost" className="gap-2 -ml-4 text-slate-500 hover:text-slate-900" asChild>
        <Link to="/pacientes">
          <ArrowLeft className="w-4 h-4" /> Voltar para Pacientes
        </Link>
      </Button>

      <PacienteHeader paciente={paciente} />

      <Tabs defaultValue="protocolo" className="w-full">
        <TabsList className="w-full sm:w-auto flex-col sm:flex-row h-auto p-1 bg-slate-100 mb-8 border border-border rounded-lg">
          <TabsTrigger
            value="protocolo"
            className="w-full sm:w-auto py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Protocolo Atual
          </TabsTrigger>
          <TabsTrigger
            value="historico"
            className="w-full sm:w-auto py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Histórico (Timeline)
          </TabsTrigger>
          <TabsTrigger
            value="intervencoes"
            className="w-full sm:w-auto py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Intervenções
          </TabsTrigger>
        </TabsList>

        <TabsContent value="protocolo" className="m-0">
          <TabProtocolo protocolo={protocoloAtual} />
        </TabsContent>

        <TabsContent value="historico" className="m-0">
          <TabHistorico sessoes={sessoes} />
        </TabsContent>

        <TabsContent value="intervencoes" className="m-0">
          <TabIntervencoes intervencoes={intervencoes} pacienteId={id!} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

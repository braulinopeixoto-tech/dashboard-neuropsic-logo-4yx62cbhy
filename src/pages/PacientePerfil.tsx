import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { getPaciente, getProtocolos, getSessoes } from '@/services/pacientes'
import { getIntervencoes } from '@/services/intervencoes'
import { getDndasByPaciente } from '@/services/dnda'
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
  const [dndas, setDndas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    if (!id) return
    try {
      const [pt, prots, sess, intervs, dndasRes] = await Promise.all([
        getPaciente(id),
        getProtocolos(id),
        getSessoes(id),
        getIntervencoes(id),
        getDndasByPaciente(id),
      ])
      setPaciente(pt)
      setProtocolos(prots)
      setSessoes(sess)
      setIntervencoes(intervs)
      setDndas(dndasRes)
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button variant="ghost" className="gap-2 -ml-4 text-slate-500 hover:text-slate-900" asChild>
          <Link to="/pacientes">
            <ArrowLeft className="w-4 h-4" /> Voltar para Pacientes
          </Link>
        </Button>
        <Button
          className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
          asChild
        >
          <Link to={`/pacientes/${id}/dnda/novo`}>Nova DNDA™</Link>
        </Button>
      </div>

      <PacienteHeader paciente={paciente} />

      <Tabs defaultValue="protocolo" className="w-full">
        <TabsList className="w-full sm:w-auto flex-col sm:flex-row h-auto p-1 bg-slate-100 mb-8 border border-border rounded-lg">
          <TabsTrigger
            value="protocolo"
            className="w-full sm:w-auto py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
          >
            Protocolo Atual
          </TabsTrigger>
          <TabsTrigger
            value="historico"
            className="w-full sm:w-auto py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
          >
            Histórico (Timeline)
          </TabsTrigger>
          <TabsTrigger
            value="intervencoes"
            className="w-full sm:w-auto py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
          >
            Intervenções
          </TabsTrigger>
          <TabsTrigger
            value="dnda"
            className="w-full sm:w-auto py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
          >
            Avaliações DNDA™
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="protocolo"
          className="m-0 transition-opacity duration-200 animate-fade-in"
        >
          <TabProtocolo protocolo={protocoloAtual} />
        </TabsContent>

        <TabsContent
          value="historico"
          className="m-0 transition-opacity duration-200 animate-fade-in"
        >
          <TabHistorico sessoes={sessoes} />
        </TabsContent>

        <TabsContent
          value="intervencoes"
          className="m-0 transition-opacity duration-200 animate-fade-in"
        >
          <TabIntervencoes intervencoes={intervencoes} pacienteId={id!} />
        </TabsContent>

        <TabsContent value="dnda" className="m-0 transition-opacity duration-200 animate-fade-in">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold mb-4 text-slate-800">Histórico DNDA™</h3>
            {dndas.length > 0 ? (
              <div className="space-y-4">
                {dndas.map((d) => (
                  <div
                    key={d.id}
                    className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-4 border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">
                        Avaliação do dia {new Date(d.created).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-sm text-slate-500 capitalize">
                        Risco: {d.d8_risk || 'N/A'} | Estado: {d.d1_class || 'N/A'}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto text-primary hover:text-primary"
                      asChild
                    >
                      <Link to={`/pacientes/${id}/dnda/${d.id}`}>Visualizar Relatório</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">Nenhuma avaliação DNDA™ encontrada.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

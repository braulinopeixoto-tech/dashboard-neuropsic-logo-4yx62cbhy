import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { sealAuditLog } from '@/services/audit_log'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { getPaciente, getProtocolos, getSessoes } from '@/services/pacientes'
import { getIntervencoes } from '@/services/intervencoes'
import { getDndasByPaciente } from '@/services/dnda'
import { ArrowLeft } from 'lucide-react'

import { Activity } from 'lucide-react'
import { PacienteHeader } from '@/components/paciente/PacienteHeader'
import { TabProtocolo } from '@/components/paciente/TabProtocolo'
import { TabHistorico } from '@/components/paciente/TabHistorico'
import { TabIntervencoes } from '@/components/paciente/TabIntervencoes'
import { VitalScoreDialog } from '@/components/paciente/VitalScoreDialog'

export default function PacientePerfil() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const { user } = useAuth()

  const auditDataRef = useRef({
    startTime: null as number | null,
    patient: null as { id: string; nome: string } | null,
    sections: new Set<string>(['protocolo']),
    user: user,
  })

  useEffect(() => {
    if (user) {
      auditDataRef.current.user = user
    }
  }, [user])

  useEffect(() => {
    return () => {
      const { startTime, patient, sections, user: currentUser } = auditDataRef.current
      if (startTime && patient && currentUser) {
        const duration = Math.floor((Date.now() - startTime) / 1000)
        const payload = {
          paciente_id: patient.id,
          paciente_nome: patient.nome,
          tempo_visualizacao: duration,
          secoes_acessadas: Array.from(sections),
          timestamp: new Date().toISOString(),
        }

        sealAuditLog({
          user_id: currentUser.id,
          event_type: 'acesso_prontuario',
          action_description: `Prontuario do paciente ${patient.nome} foi acessado`,
          payload,
        })
          .then(() => {
            toast({ description: 'Acesso registrado' })
          })
          .catch((err) => {
            console.error(`Erro ao registrar acesso em auditoria: ${err.message || err}`)
          })
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [paciente, setPaciente] = useState<any>(null)
  const [protocolos, setProtocolos] = useState<any[]>([])
  const [sessoes, setSessoes] = useState<any[]>([])
  const [intervencoes, setIntervencoes] = useState<any[]>([])
  const [dndas, setDndas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [vitalScoreModalOpen, setVitalScoreModalOpen] = useState(false)

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
      if (pt && !auditDataRef.current.patient) {
        auditDataRef.current.startTime = Date.now()
        auditDataRef.current.patient = { id: pt.id, nome: pt.nome }
      }
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
        <div className="flex flex-wrap gap-2 justify-end">
          <Button
            variant="outline"
            className="shadow-sm border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
            onClick={() => {
              setVitalScoreModalOpen(true)
              auditDataRef.current.sections.add('vital_scores')
            }}
            disabled={!protocolos.length}
          >
            <Activity className="h-4 w-4 mr-2" /> Vital Score
          </Button>
          <Button variant="outline" className="shadow-sm" asChild>
            <Link to={`/pacientes/${id}/anamnese`}>Nova Anamnese (IA)</Link>
          </Button>
          <Button variant="outline" className="shadow-sm" asChild>
            <Link to={`/relatorio-final/${id}`}>Gerar Relatório Final</Link>
          </Button>
          <Button
            className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            asChild
          >
            <Link to={`/pacientes/${id}/dnda/novo`}>Nova DNDA™</Link>
          </Button>
        </div>
      </div>

      <PacienteHeader paciente={paciente} />

      {protocoloAtual && (
        <VitalScoreDialog
          open={vitalScoreModalOpen}
          onOpenChange={setVitalScoreModalOpen}
          pacienteId={id!}
          protocoloId={protocoloAtual.id}
        />
      )}

      <Tabs
        defaultValue="protocolo"
        className="w-full"
        onValueChange={(value) => auditDataRef.current.sections.add(value)}
      >
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

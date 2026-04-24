import { useState, useEffect } from 'react'
import { getAlertas, marcarComoLido } from '@/services/alertas'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, AlertOctagon, AlertTriangle, Info, CheckCircle2 } from 'lucide-react'
import { InterventionModal } from '@/components/InterventionModal'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function Alertas() {
  const { user } = useAuth()
  const [alertas, setAlertas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState('todos')

  const [intervencaoModal, setIntervencaoModal] = useState<{
    open: boolean
    alertaId: string
    pacienteId: string
  }>({
    open: false,
    alertaId: '',
    pacienteId: '',
  })

  const loadAlertas = async () => {
    if (!user) return
    try {
      const res = await getAlertas(user.id)
      setAlertas(res)
      setError(false)
    } catch (e) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlertas()
  }, [user])

  useRealtime('alertas', () => {
    loadAlertas()
  })

  const handleMarcarLido = async (id: string) => {
    try {
      await marcarComoLido(id)
      toast.success('Alerta marcado como lido')
    } catch {
      toast.error('Erro ao atualizar alerta')
    }
  }

  const filteredAlertas = alertas.filter((a) => {
    if (filter === 'nao_lidos') return !a.lido
    if (filter === 'risco_desistência') return a.tipo === 'risco_desistência'
    if (filter === 'falta_consecutiva') return a.tipo === 'falta_consecutiva'
    if (filter === 'pausa_excedida') return a.tipo === 'pausa_excedida'
    return true
  })

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'falta_consecutiva':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'risco_desistência':
        return <AlertOctagon className="h-5 w-5 text-red-500" />
      case 'pausa_excedida':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  if (user?.tipo !== 'neuropsicólogo') {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Acesso restrito a neuropsicólogos.
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Alertas Clínicos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie notificações de risco e intervenções
          </p>
        </div>
      </div>

      <Tabs defaultValue="todos" value={filter} onValueChange={setFilter}>
        <TabsList className="flex flex-wrap h-auto mb-4">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="nao_lidos">Não lidos</TabsTrigger>
          <TabsTrigger value="risco_desistência">Risco de Desistência</TabsTrigger>
          <TabsTrigger value="falta_consecutiva">Falta Consecutiva</TabsTrigger>
          <TabsTrigger value="pausa_excedida">Pausa Excedida</TabsTrigger>
        </TabsList>
      </Tabs>

      {error && (
        <div className="p-8 text-center text-red-500">
          Erro ao carregar alertas. Tente novamente.
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredAlertas.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
          <h3 className="text-lg font-medium text-slate-900">Nenhum alerta</h3>
          <p className="text-slate-500">Tudo sob controle por aqui.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlertas.map((alerta) => (
            <div
              key={alerta.id}
              className={cn(
                'flex flex-col sm:flex-row gap-4 p-5 bg-white border rounded-xl shadow-sm transition-colors duration-200',
                !alerta.lido ? 'border-l-4 border-l-red-500' : 'border-slate-200 opacity-75',
              )}
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="mt-1 shrink-0 p-2 bg-slate-50 rounded-full">
                  {getIcon(alerta.tipo)}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">
                    {alerta.expand?.paciente_id?.nome || 'Paciente não encontrado'}
                  </h4>
                  <p className="text-sm text-slate-600 mt-1">{alerta.mensagem}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(alerta.created).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="flex sm:flex-col gap-2 shrink-0 justify-center">
                {!alerta.lido && (
                  <Button variant="outline" size="sm" onClick={() => handleMarcarLido(alerta.id)}>
                    Marcar como lido
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() =>
                    setIntervencaoModal({
                      open: true,
                      alertaId: alerta.id,
                      pacienteId: alerta.paciente_id,
                    })
                  }
                >
                  Intervir
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {intervencaoModal.open && (
        <InterventionModal
          open={intervencaoModal.open}
          onOpenChange={(open) => setIntervencaoModal((prev) => ({ ...prev, open }))}
          alertaId={intervencaoModal.alertaId}
          pacienteId={intervencaoModal.pacienteId}
        />
      )}
    </div>
  )
}

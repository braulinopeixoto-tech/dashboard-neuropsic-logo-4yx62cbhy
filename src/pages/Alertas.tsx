import { useState, useEffect } from 'react'
import { getAlertas, marcarComoLido } from '@/services/alertas'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react'
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
    alerta: any
  }>({
    open: false,
    alerta: null,
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
      case 'risco_desistência':
        return <AlertCircle className="h-6 w-6 text-error shrink-0" />
      case 'pausa_excedida':
        return <AlertTriangle className="h-6 w-6 text-alert shrink-0" />
      default:
        return <ShieldAlert className="h-6 w-6 text-primary shrink-0" />
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
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <div className="mb-[32px]">
        <h1 className="text-[24px] font-bold tracking-tight text-slate-900">Alertas Clínicos</h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          Gerencie notificações de risco e intervenções
        </p>
      </div>

      <Tabs defaultValue="todos" value={filter} onValueChange={setFilter} className="mb-[32px]">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="nao_lidos">Não lidos</TabsTrigger>
          <TabsTrigger value="risco_desistência">Risco de Desistência</TabsTrigger>
          <TabsTrigger value="falta_consecutiva">Falta Consecutiva</TabsTrigger>
          <TabsTrigger value="pausa_excedida">Pausa Excedida</TabsTrigger>
        </TabsList>
      </Tabs>

      {error && (
        <div className="p-8 text-center text-error bg-error/10 rounded-xl mb-[32px]">
          Erro ao carregar alertas. Tente novamente.
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-[16px]">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredAlertas.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
          <CheckCircle2 className="h-12 w-12 text-success mb-4" />
          <h3 className="text-[16px] font-semibold text-slate-900">Nenhum alerta</h3>
          <p className="text-[14px] text-slate-500 mt-1">Tudo sob controle por aqui.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-[16px]">
          {filteredAlertas.map((alerta) => (
            <div
              key={alerta.id}
              className={cn(
                'flex flex-col sm:flex-row gap-4 p-[20px] bg-white border rounded-xl shadow-subtle transition-all duration-200',
                !alerta.lido ? 'border-l-4 border-l-error' : 'border-slate-200 opacity-75',
              )}
            >
              <div className="flex items-start gap-4 flex-1">
                {getIcon(alerta.tipo)}
                <div>
                  <h4 className="text-[16px] font-semibold text-slate-900">
                    {alerta.expand?.paciente_id?.nome || 'Paciente não encontrado'} —{' '}
                    {alerta.mensagem}
                  </h4>
                  {alerta.intervencao_realizada && (
                    <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-1 text-[12px] font-medium text-success mt-2">
                      Intervenção realizada
                    </span>
                  )}
                  <p className="text-[14px] text-slate-400 mt-2">
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
                      alerta: alerta,
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

      {intervencaoModal.open && intervencaoModal.alerta && (
        <InterventionModal
          open={intervencaoModal.open}
          onOpenChange={(open) => setIntervencaoModal((prev) => ({ ...prev, open }))}
          alerta={intervencaoModal.alerta}
        />
      )}
    </div>
  )
}

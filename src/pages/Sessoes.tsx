import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getSessoesHoje, registrarExecucao } from '@/services/sessoes'
import { useRealtime } from '@/hooks/use-realtime'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Clock, Activity, AlertTriangle, CheckCircle2, PlayCircle, CalendarX2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

function ExecutionModal({ open, onOpenChange, sessao, user, onSuccess }: any) {
  const [elapsed, setElapsed] = useState(0)
  const [obs, setObs] = useState('')
  const [concluida, setConcluida] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let t: any
    if (open) t = setInterval(() => setElapsed((prev) => prev + 1), 1000)
    else {
      setElapsed(0)
      setObs('')
      setConcluida(false)
    }
    return () => clearInterval(t)
  }, [open])

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const handleSubmit = async () => {
    if (!concluida) return
    setIsSubmitting(true)
    try {
      await registrarExecucao(sessao.id, obs, sessao.paciente_id, user.id, 'realizada')
      onSuccess()
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Execução de Sessão</DialogTitle>
          <DialogDescription>
            Paciente: <strong className="text-slate-900">{sessao.expand?.paciente_id?.nome}</strong>
            <br />
            Protocolo: {sessao.expand?.protocolo_id?.tipo} (Sessão {sessao.numero_sessao})
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-6">
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider">
              Tempo Decorrido
            </span>
            <div className="text-5xl font-mono font-bold text-blue-600 tracking-tight">
              {formatTime(elapsed)}
            </div>
          </div>
          <div className="space-y-3">
            <Label htmlFor="obs" className="text-slate-700">
              Observações rápidas
            </Label>
            <Textarea
              id="obs"
              placeholder="Sinais, sintomas, comportamento do paciente..."
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              className="resize-none h-24"
            />
          </div>
          <div className="flex items-center space-x-3 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <Checkbox
              id="concluida"
              checked={concluida}
              onCheckedChange={(c) => setConcluida(c as boolean)}
              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <Label
              htmlFor="concluida"
              className="text-sm font-medium cursor-pointer text-slate-900"
            >
              Sessão concluída com sucesso
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!concluida || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? 'Registrando...' : 'Registrar execução'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SessaoCard({ sessao, user, onRegistered }: any) {
  const [now, setNow] = useState(new Date())
  const { toast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const paciente = sessao.expand?.paciente_id
  const protocolo = sessao.expand?.protocolo_id
  const minMin = protocolo?.intervalo_minimo_minutos || 0

  const intervalStatus = useMemo(() => {
    if (!sessao.lastSessao?.data_realizada) return { ok: true, text: 'Primeira sessão' }

    const diffSecs = Math.floor(
      (now.getTime() - new Date(sessao.lastSessao.data_realizada).getTime()) / 1000,
    )
    const minSecs = minMin * 60

    if (diffSecs >= minSecs) return { ok: true, text: `${Math.floor(diffSecs / 60)} minutos (OK)` }

    const faltam = minSecs - diffSecs
    return {
      ok: false,
      text: `${Math.floor(diffSecs / 60)} minutos (⚠️ Faltam ${Math.floor(faltam / 60)}m ${faltam % 60}s)`,
    }
  }, [now, sessao, minMin])

  const isRealizada = sessao.status === 'realizada'
  const horaFormatada = sessao.data_agendada
    ? new Date(sessao.data_agendada).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '--:--'

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md relative">
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-1',
          isRealizada ? 'bg-emerald-500' : intervalStatus.ok ? 'bg-blue-500' : 'bg-amber-500',
        )}
      />
      <div className="p-4 sm:p-6 mt-1">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg text-slate-900">
                {paciente?.nome || 'Paciente Desconhecido'}
              </span>
              <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                Sessão {sessao.numero_sessao}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-2 gap-x-6 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Activity className="h-4 w-4 text-blue-500" />
                <span>{protocolo?.tipo || 'Protocolo'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>{horaFormatada}</span>
              </div>
              <div className="flex items-center gap-2">
                {!isRealizada ? (
                  <span
                    className={cn(
                      'font-medium flex items-center gap-1.5',
                      intervalStatus.ok ? 'text-emerald-600' : 'text-amber-600',
                    )}
                  >
                    {intervalStatus.ok ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    {intervalStatus.text}
                  </span>
                ) : (
                  <span className="font-medium text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Realizada
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center sm:justify-end">
            {!isRealizada ? (
              <Button
                onClick={() => setModalOpen(true)}
                disabled={!intervalStatus.ok}
                className={cn(
                  'w-full sm:w-auto transition-all shadow-sm',
                  intervalStatus.ok
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-slate-100 text-slate-400 opacity-100',
                )}
              >
                <PlayCircle className="h-4 w-4 mr-2" /> Iniciar sessão
              </Button>
            ) : (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 px-3 py-1.5 text-sm rounded-md shadow-sm pointer-events-none">
                Concluída
              </Badge>
            )}
          </div>
        </div>
      </div>
      <ExecutionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        sessao={sessao}
        user={user}
        onSuccess={() => {
          toast({
            title: 'Sessão registrada!',
            description: 'Neuropsicólogo foi notificado com sucesso.',
          })
          onRegistered()
        }}
      />
    </div>
  )
}

export default function MinhasSessoes() {
  const { user } = useAuth()
  const [sessoes, setSessoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [unidadeFiltro, setUnidadeFiltro] = useState<string>('Todas')

  const loadSessoes = async () => {
    try {
      setError(false)
      setSessoes(await getSessoesHoje(user.id))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) loadSessoes()
  }, [user?.id])
  useRealtime('sessoes', loadSessoes)

  const unidades = useMemo(() => {
    const uns = new Set<string>()
    sessoes.forEach((s) => s.expand?.paciente_id?.unidade && uns.add(s.expand.paciente_id.unidade))
    return ['Todas', 'Cidade A', 'Cidade B', 'Cidade C', 'Cidade D', ...Array.from(uns)].filter(
      (v, i, a) => a.indexOf(v) === i,
    )
  }, [sessoes])

  const sessoesFiltradas = useMemo(
    () =>
      sessoes
        .filter(
          (s) => unidadeFiltro === 'Todas' || s.expand?.paciente_id?.unidade === unidadeFiltro,
        )
        .sort((a, b) => new Date(a.data_agendada).getTime() - new Date(b.data_agendada).getTime()),
    [sessoes, unidadeFiltro],
  )

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Sessões de Hoje</h1>
        <div className="w-full sm:w-64">
          <Select value={unidadeFiltro} onValueChange={setUnidadeFiltro}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por unidade" />
            </SelectTrigger>
            <SelectContent>
              {unidades.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-xl border border-slate-200">
          <AlertTriangle className="h-10 w-10 text-rose-500 mb-4" />
          <p className="text-slate-600 mb-4">Erro ao carregar sessões. Tente novamente.</p>
          <Button onClick={loadSessoes} variant="outline">
            Tentar Novamente
          </Button>
        </div>
      ) : sessoesFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
          <CalendarX2 className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">Nenhuma sessão hoje</h3>
          <p className="text-slate-500 max-w-md">
            Não há sessões agendadas para os filtros selecionados ou para o dia de hoje.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1">
          {sessoesFiltradas.map((s) => (
            <SessaoCard key={s.id} sessao={s} user={user} onRegistered={loadSessoes} />
          ))}
        </div>
      )}
    </div>
  )
}

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
import { useToast } from '@/hooks/use-toast'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { RemarcarModal } from '@/components/sessoes/RemarcarModal'

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
          <DialogTitle className="text-[24px] font-bold">Execução de Sessão</DialogTitle>
          <DialogDescription className="text-[14px] font-normal">
            Paciente: <strong className="text-slate-900">{sessao.expand?.paciente_id?.nome}</strong>
            <br />
            Protocolo: {sessao.expand?.protocolo_id?.tipo} (Sessão {sessao.numero_sessao})
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-[16px]">
          <div className="flex flex-col items-center justify-center p-[20px] bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[14px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">
              Tempo Decorrido
            </span>
            <div className="text-5xl font-mono font-bold text-primary tracking-tight">
              {formatTime(elapsed)}
            </div>
          </div>
          <div className="space-y-3">
            <Label htmlFor="obs" className="text-[14px] font-semibold text-slate-700">
              Observações rápidas
            </Label>
            <Textarea
              id="obs"
              placeholder="Sinais, sintomas, comportamento do paciente..."
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              className="resize-none h-24 text-[14px] font-normal"
            />
          </div>
          <div className="flex items-center space-x-3 bg-slate-50 p-[20px] rounded-lg border border-slate-100">
            <Checkbox
              id="concluida"
              checked={concluida}
              onCheckedChange={(c) => setConcluida(c as boolean)}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-colors duration-200"
            />
            <Label
              htmlFor="concluida"
              className="text-[14px] font-medium cursor-pointer text-slate-900"
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
            className="bg-primary hover:bg-primary/90 text-white transition-colors duration-200"
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
  const [remarcarOpen, setRemarcarOpen] = useState(false)
  const [isRegisteringFalta, setIsRegisteringFalta] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const paciente = sessao.expand?.paciente_id
  const protocolo = sessao.expand?.protocolo_id
  const minMin = protocolo?.intervalo_minimo_minutos || 0

  const intervalStatus = useMemo(() => {
    if (!sessao.lastSessao?.data_realizada)
      return { ok: true, text: 'Primeira sessão', isLow: false }

    const diffSecs = Math.floor(
      (now.getTime() - new Date(sessao.lastSessao.data_realizada).getTime()) / 1000,
    )
    const minSecs = minMin * 60

    if (diffSecs >= minSecs)
      return { ok: true, text: `${Math.floor(diffSecs / 60)} minutos (OK)`, isLow: false }

    const faltam = minSecs - diffSecs
    return {
      ok: false,
      text: `${Math.floor(diffSecs / 60)} min (Faltam ${Math.floor(faltam / 60)}m ${faltam % 60}s)`,
      isLow: faltam <= 300, // less than 5 minutes
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
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all duration-200 hover:shadow-elevation relative">
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-1 transition-colors duration-200',
          isRealizada ? 'bg-success' : intervalStatus.ok ? 'bg-primary' : 'bg-alert',
        )}
      />
      <div className="p-[20px] mt-1">
        <div className="flex flex-col sm:flex-row justify-between gap-[16px]">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[16px] text-slate-900">
                👤 {paciente?.nome || 'Paciente Desconhecido'}
              </span>
              <Badge
                variant="outline"
                className="bg-slate-50 text-slate-600 border-slate-200 transition-colors duration-200 text-[14px] font-normal"
              >
                Sessão {sessao.numero_sessao}
              </Badge>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-y-2 gap-x-6 text-[14px] font-normal">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span>🔬</span>
                <span>{protocolo?.tipo || 'Protocolo'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span>⏱️</span>
                <span>{horaFormatada}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {!isRealizada ? (
                  <span
                    className={cn(
                      'font-medium flex items-center gap-1.5 transition-colors duration-200',
                      intervalStatus.ok ? 'text-success' : 'text-alert',
                      intervalStatus.isLow && !intervalStatus.ok && 'animate-pulse',
                    )}
                  >
                    {intervalStatus.ok ? <span>✅</span> : <span>⚠️</span>}
                    {intervalStatus.text}
                  </span>
                ) : (
                  <span className="font-medium text-success flex items-center gap-1.5 transition-colors duration-200">
                    <span>✅</span> Realizada
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center sm:justify-end gap-2">
            {!isRealizada && sessao.status !== 'faltou' && sessao.status !== 'remarcada' ? (
              <>
                <Button
                  onClick={() => setRemarcarOpen(true)}
                  variant="outline"
                  className="w-full sm:w-auto transition-colors duration-200 shadow-sm text-[14px] font-semibold text-slate-700 border-slate-300"
                >
                  Remarcar
                </Button>
                <Button
                  onClick={async () => {
                    setIsRegisteringFalta(true)
                    try {
                      const { registrarFalta } = await import('@/services/sessoes')
                      await registrarFalta(sessao.id, sessao.paciente_id, user.id)
                      toast({
                        title: 'Falta registrada',
                        description:
                          'A falta foi registrada e o WhatsApp enviado. Por favor, remarque a sessão.',
                      })
                      onRegistered()
                      setRemarcarOpen(true)
                    } catch (e) {
                      toast({
                        title: 'Erro',
                        description: 'Erro ao registrar falta. Tente novamente mais tarde.',
                        variant: 'destructive',
                      })
                    } finally {
                      setIsRegisteringFalta(false)
                    }
                  }}
                  disabled={isRegisteringFalta}
                  variant="outline"
                  className="w-full sm:w-auto transition-colors duration-200 shadow-sm text-[14px] font-semibold text-alert border-alert hover:bg-alert/10 hover:text-alert"
                >
                  {isRegisteringFalta ? 'Registrando...' : 'Registrar falta'}
                </Button>
                <Button
                  onClick={() => setModalOpen(true)}
                  disabled={!intervalStatus.ok}
                  className={cn(
                    'w-full sm:w-auto transition-colors duration-200 shadow-sm text-[14px] font-semibold',
                    intervalStatus.ok
                      ? 'bg-primary hover:bg-primary/90 text-white'
                      : 'bg-slate-100 text-slate-400 opacity-100',
                  )}
                >
                  Iniciar sessão
                </Button>
              </>
            ) : isRealizada ? (
              <div
                className="px-3 py-1.5 text-[14px] font-semibold rounded-md shadow-sm pointer-events-none transition-colors duration-200 border"
                style={{
                  backgroundColor: 'hsla(142, 71%, 45%, 0.1)',
                  color: 'hsl(142, 71%, 45%)',
                  borderColor: 'hsla(142, 71%, 45%, 0.2)',
                }}
              >
                Concluída
              </div>
            ) : sessao.status === 'faltou' || sessao.status === 'remarcada' ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="px-3 py-1.5 text-[14px] font-semibold rounded-md shadow-sm pointer-events-none transition-colors duration-200 border bg-alert/10 text-alert border-alert/20">
                  {sessao.status === 'faltou' ? 'Faltou' : 'Remarcada'}
                </div>
                {sessao.status === 'faltou' && (
                  <Button
                    onClick={() => setRemarcarOpen(true)}
                    variant="outline"
                    className="w-full sm:w-auto transition-colors duration-200 shadow-sm text-[14px] font-semibold text-slate-700 border-slate-300"
                  >
                    Remarcar
                  </Button>
                )}
              </div>
            ) : null}
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
      <RemarcarModal
        open={remarcarOpen}
        onOpenChange={setRemarcarOpen}
        sessao={sessao}
        onSuccess={onRegistered}
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
    <div className="mb-[32px] max-w-5xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-[16px] mb-[32px]">
        <h1 className="text-[24px] font-bold tracking-tight text-slate-900">Sessões de Hoje</h1>
        <div className="w-full sm:w-64">
          <Select value={unidadeFiltro} onValueChange={setUnidadeFiltro}>
            <SelectTrigger className="text-[14px] font-normal">
              <SelectValue placeholder="Filtrar por unidade" />
            </SelectTrigger>
            <SelectContent>
              {unidades.map((u) => (
                <SelectItem key={u} value={u} className="text-[14px] font-normal">
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-[16px]">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-xl border border-slate-200">
          <span className="text-4xl mb-4">⚠️</span>
          <p className="text-[14px] font-normal text-slate-600 mb-4">
            Erro ao carregar sessões. Tente novamente.
          </p>
          <Button onClick={loadSessoes} variant="outline" className="text-[14px] font-semibold">
            Tentar Novamente
          </Button>
        </div>
      ) : sessoesFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-4xl mb-4 opacity-50">⏱️</span>
          <h3 className="text-[16px] font-semibold text-slate-900 mb-1">Nenhuma sessão hoje</h3>
          <p className="text-[14px] font-normal text-slate-500 max-w-md">
            Não há sessões agendadas para os filtros selecionados ou para o dia de hoje.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-[16px]">
          {sessoesFiltradas.map((s) => (
            <SessaoCard key={s.id} sessao={s} user={user} onRegistered={loadSessoes} />
          ))}
        </div>
      )}
    </div>
  )
}

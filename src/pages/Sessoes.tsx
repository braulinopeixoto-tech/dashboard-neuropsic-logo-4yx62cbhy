import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { getSessoesHoje, registrarExecucao, ensureMockDataForToday } from '@/services/sessoes'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Clock, PlayCircle, CalendarOff, CheckCircle2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RemarcarModal } from '@/components/sessoes/RemarcarModal'

export default function Sessoes() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [sessoes, setSessoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [filterUnit, setFilterUnit] = useState<string>('all')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeSessao, setActiveSessao] = useState<any>(null)
  const [observacoes, setObservacoes] = useState('')
  const [statusSessao, setStatusSessao] = useState<'realizada' | 'faltou' | ''>('')
  const [elapsed, setElapsed] = useState(0)

  const [isRemarcarOpen, setIsRemarcarOpen] = useState(false)
  const [sessaoParaRemarcar, setSessaoParaRemarcar] = useState<any>(null)

  const loadData = async () => {
    if (!user?.id) return
    try {
      setError(false)
      await ensureMockDataForToday(user.id)
      const data = await getSessoesHoje(user.id)
      setSessoes(data)
    } catch (e) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])
  useRealtime('sessoes', () => {
    loadData()
  })

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isModalOpen) timer = setInterval(() => setElapsed((e) => e + 1), 1000)
    else setElapsed(0)
    return () => clearInterval(timer)
  }, [isModalOpen])

  const units = Array.from(
    new Set(sessoes.map((s) => s.expand?.paciente_id?.unidade).filter(Boolean)),
  ) as string[]
  const filtered = sessoes.filter(
    (s) => filterUnit === 'all' || s.expand?.paciente_id?.unidade === filterUnit,
  )

  const handleStart = (sessao: any) => {
    setActiveSessao(sessao)
    setObservacoes('')
    setStatusSessao('')
    setIsModalOpen(true)
  }

  const handleRegister = async () => {
    if (!statusSessao || !activeSessao) return
    try {
      await registrarExecucao(
        activeSessao.id,
        observacoes,
        activeSessao.paciente_id,
        activeSessao.usuario_id,
        statusSessao as 'realizada' | 'faltou',
      )

      setIsModalOpen(false)

      if (statusSessao === 'faltou') {
        toast({ title: 'Falta registrada', description: 'Iniciando remarcação inteligente...' })
        setSessaoParaRemarcar(activeSessao)
        setIsRemarcarOpen(true)
      } else {
        toast({ title: 'Sessão registrada!', description: 'Sessão marcada como realizada.' })
      }

      setActiveSessao(null)
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao registrar a sessão.', variant: 'destructive' })
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sessões de Hoje</h1>
          <p className="text-slate-500">Gerencie a execução dos protocolos agendados.</p>
        </div>
        <Select value={filterUnit} onValueChange={setFilterUnit}>
          <SelectTrigger className="w-full sm:w-[220px] bg-white">
            <SelectValue placeholder="Filtrar por unidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as unidades</SelectItem>
            {units.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-16 text-slate-500 bg-white rounded-xl border">
          <AlertTriangle className="w-12 h-12 mb-4 text-rose-400" />
          <p>Erro ao carregar sessões. Tente novamente.</p>
          <Button variant="outline" className="mt-4" onClick={loadData}>
            Tentar Novamente
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
          <CalendarOff className="w-12 h-12 mb-4 text-slate-300" />
          <p className="text-lg font-medium text-slate-600">Nenhuma sessão hoje</p>
          <p className="text-sm">Você não tem sessões agendadas para esta unidade.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((sessao) => (
            <SessaoCard
              key={sessao.id}
              sessao={sessao}
              isActive={activeSessao?.id === sessao.id}
              onStart={handleStart}
              onRemarcar={() => {
                setSessaoParaRemarcar(sessao)
                setIsRemarcarOpen(true)
              }}
              userRole={user?.tipo}
            />
          ))}
        </div>
      )}

      <RemarcarModal
        sessao={sessaoParaRemarcar}
        open={isRemarcarOpen}
        onOpenChange={setIsRemarcarOpen}
        onSuccess={loadData}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Execução de Sessão</DialogTitle>
            <DialogDescription>
              {activeSessao?.expand?.paciente_id?.nome} - {activeSessao?.expand?.protocolo_id?.tipo}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-lg my-4 border">
            <span className="text-sm text-slate-500 font-medium mb-1">Tempo decorrido</span>
            <span className="text-5xl font-bold font-mono text-slate-800 tracking-wider">
              {formatTime(elapsed)}
            </span>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Observações rápidas</label>
              <Textarea
                placeholder="Sinais, sintomas, comportamento..."
                className="resize-none h-24"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
              <label className="text-sm font-medium text-slate-700">Status da Sessão</label>
              <RadioGroup
                value={statusSessao}
                onValueChange={(val: any) => setStatusSessao(val)}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="realizada" id="realizada" />
                  <Label htmlFor="realizada" className="cursor-pointer">
                    Realizada com sucesso
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="faltou" id="faltou" />
                  <Label htmlFor="faltou" className="cursor-pointer text-amber-700">
                    Paciente Faltou
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRegister} disabled={!statusSessao}>
              Registrar execução
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SessaoCard({
  sessao,
  isActive,
  onStart,
  onRemarcar,
  userRole,
}: {
  sessao: any
  isActive: boolean
  onStart: (s: any) => void
  onRemarcar: () => void
  userRole?: string
}) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000)
    return () => clearInterval(timer)
  }, [])

  const paciente = sessao.expand?.paciente_id
  const protocolo = sessao.expand?.protocolo_id
  const minIntervalo = protocolo?.intervalo_minimo_minutos || 0

  let nextAllowedTime = new Date(0)
  if (sessao.lastSessao?.data_realizada) {
    nextAllowedTime = new Date(
      new Date(sessao.lastSessao.data_realizada).getTime() + minIntervalo * 60000,
    )
  }

  const isAllowed = now >= nextAllowedTime
  const missingMin = Math.max(0, Math.ceil((nextAllowedTime.getTime() - now.getTime()) / 60000))

  return (
    <div
      className={cn(
        'bg-white border rounded-xl p-5 shadow-sm flex flex-col gap-4 transition-all hover:shadow-md',
        isActive && 'border-blue-400 ring-1 ring-blue-400',
      )}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg text-slate-900">{paciente?.nome || 'Paciente'}</h3>
          <p className="text-sm text-slate-500">Unidade: {paciente?.unidade || 'N/A'}</p>
        </div>
        {isActive ? (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Em execução</Badge>
        ) : sessao.status === 'realizada' ? (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">Concluída</Badge>
        ) : sessao.status === 'faltou' ? (
          <Badge className="bg-rose-500 hover:bg-rose-600 text-white">Faltou</Badge>
        ) : sessao.status === 'agendada' ? (
          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
            Aguardando
          </Badge>
        ) : (
          <Badge variant="secondary">{sessao.status}</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg text-sm">
        <div>
          <span className="block text-slate-500 mb-1">Protocolo</span>
          <span className="font-semibold text-slate-800">{protocolo?.tipo}</span>
        </div>
        <div>
          <span className="block text-slate-500 mb-1">Agendado</span>
          <span className="font-semibold text-slate-800 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {sessao.data_agendada
              ? new Date(sessao.data_agendada).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '--:--'}
          </span>
        </div>
      </div>

      {sessao.status === 'agendada' && minIntervalo > 0 && !isActive && (
        <div
          className={cn(
            'text-sm p-3 rounded-md flex items-center gap-2',
            isAllowed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
          )}
        >
          {isAllowed ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>
            {minIntervalo} minutos
            {!isAllowed && <span className="font-semibold ml-1">(⚠️ Faltam {missingMin}min)</span>}
            {isAllowed && <span className="font-semibold ml-1">(OK)</span>}
          </span>
        </div>
      )}

      {sessao.status === 'agendada' && !isActive && (
        <Button
          onClick={() => onStart(sessao)}
          disabled={!isAllowed}
          className="w-full mt-2 sm:w-auto self-start"
        >
          <PlayCircle className="w-4 h-4 mr-2" />
          Iniciar Sessão
        </Button>
      )}

      {sessao.status === 'realizada' && (
        <div className="text-sm text-slate-500 flex items-center gap-2 mt-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          Realizada às{' '}
          {new Date(sessao.data_realizada).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      )}

      {sessao.status === 'faltou' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
          <div className="text-sm text-rose-500 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            Sessão marcada como falta
          </div>
          {(userRole === 'assistente_líder' || userRole === 'neuromoduladora' || !userRole) && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRemarcar}
              className="text-blue-600 border-blue-200 hover:bg-blue-50 self-start sm:self-auto"
            >
              <CalendarOff className="w-4 h-4 mr-2" />
              Remarcar
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

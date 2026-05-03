import { useState, useEffect, useMemo } from 'react'
import { format, parseISO, startOfDay, endOfDay } from 'date-fns'
import { useAuth } from '@/hooks/use-auth'
import { auditLogsData, AuditRecord } from '@/data/mock'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  RefreshCw,
  ShieldCheck,
  ClipboardList,
  Clock,
  Hash,
  User,
  ShieldAlert,
} from 'lucide-react'

const ITEMS_PER_PAGE = 20

export default function Auditoria() {
  const { user } = useAuth()

  // App logic
  const isProfessional = user?.tipo === 'neuropsicólogo'
  const defaultUserFilter = isProfessional ? 'Ana Silva' : 'Todos' // Ana Silva acts as the professional mock
  const USERS_LIST = ['Todos', 'Ana Silva', 'Carlos Oliveira', 'Mariana Santos']

  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  // Temp filters (bound to UI inputs)
  const [tempEventType, setTempEventType] = useState('Todos')
  const [tempUserFilter, setTempUserFilter] = useState(defaultUserFilter)
  const [tempStartDate, setTempStartDate] = useState('')
  const [tempEndDate, setTempEndDate] = useState('')

  // Active filters (applied to list)
  const [activeFilters, setActiveFilters] = useState({
    eventType: 'Todos',
    userFilter: defaultUserFilter,
    startDate: '',
    endDate: '',
  })

  const [selectedLog, setSelectedLog] = useState<AuditRecord | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [verifyStatus, setVerifyStatus] = useState<'success' | 'error' | null>(null)

  useEffect(() => {
    // Initial artificial load
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  const applyFilters = () => {
    setIsLoading(true)
    setActiveFilters({
      eventType: tempEventType,
      userFilter: tempUserFilter,
      startDate: tempStartDate,
      endDate: tempEndDate,
    })
    setCurrentPage(1)
    setTimeout(() => setIsLoading(false), 600)
  }

  const clearFilters = () => {
    setIsLoading(true)
    setTempEventType('Todos')
    setTempUserFilter(defaultUserFilter)
    setTempStartDate('')
    setTempEndDate('')
    setActiveFilters({
      eventType: 'Todos',
      userFilter: defaultUserFilter,
      startDate: '',
      endDate: '',
    })
    setCurrentPage(1)
    setTimeout(() => setIsLoading(false), 600)
  }

  const filteredLogs = useMemo(() => {
    return auditLogsData.filter((log) => {
      if (activeFilters.eventType !== 'Todos' && log.event !== activeFilters.eventType) return false
      if (activeFilters.userFilter !== 'Todos' && log.user !== activeFilters.userFilter)
        return false

      if (activeFilters.startDate || activeFilters.endDate) {
        const logDate = new Date(log.timestamp)
        if (activeFilters.startDate && logDate < startOfDay(parseISO(activeFilters.startDate)))
          return false
        if (activeFilters.endDate && logDate > endOfDay(parseISO(activeFilters.endDate)))
          return false
      }
      return true
    })
  }, [activeFilters])

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ITEMS_PER_PAGE))
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  const handleVerify = () => {
    setVerifying(true)
    setVerifyStatus(null)
    setTimeout(() => {
      setVerifying(false)
      setVerifyStatus(selectedLog?.status === 'Corrompido' ? 'error' : 'success')
    }, 1000)
  }

  useEffect(() => {
    if (!selectedLog) {
      setVerifyStatus(null)
      setVerifying(false)
    }
  }, [selectedLog])

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Íntegro':
        return {
          icon: <CheckCircle2 className="h-4 w-4" />,
          color: 'text-emerald-600',
          bg: 'bg-emerald-50 border-emerald-200',
        }
      case 'Pendente':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          color: 'text-amber-600',
          bg: 'bg-amber-50 border-amber-200',
        }
      case 'Corrompido':
        return {
          icon: <XCircle className="h-4 w-4" />,
          color: 'text-rose-600',
          bg: 'bg-rose-50 border-rose-200',
        }
      default:
        return {
          icon: <ShieldCheck className="h-4 w-4" />,
          color: 'text-slate-600',
          bg: 'bg-slate-50 border-slate-200',
        }
    }
  }

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          <ShieldAlert className="h-8 w-8 text-primary" /> Auditoria de Logs
        </h1>
        <p className="text-slate-500 mt-1">
          Monitoramento de integridade e histórico de eventos do sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-5 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Tipo de Evento
          </label>
          <Select value={tempEventType} onValueChange={setTempEventType}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              <SelectItem value="Login">Login</SelectItem>
              <SelectItem value="Vital Score">Vital Score</SelectItem>
              <SelectItem value="Acesso Prontuário">Acesso Prontuário</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Usuário
          </label>
          <Select
            value={tempUserFilter}
            onValueChange={setTempUserFilter}
            disabled={isProfessional}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {USERS_LIST.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Data Inicial
          </label>
          <Input
            type="date"
            value={tempStartDate}
            onChange={(e) => setTempStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Data Final
          </label>
          <Input type="date" value={tempEndDate} onChange={(e) => setTempEndDate(e.target.value)} />
        </div>
        <div className="flex items-end gap-2">
          <Button className="w-full font-semibold" onClick={applyFilters}>
            <Search className="h-4 w-4 mr-2" /> Aplicar
          </Button>
          <Button variant="outline" size="icon" onClick={clearFilters} title="Limpar Filtros">
            <RefreshCw className="h-4 w-4 text-slate-500" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
          <div className="bg-slate-50 p-4 rounded-full mb-4">
            <ClipboardList className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Nenhum log encontrado</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            Ajuste os filtros de data, tipo de evento ou usuário e tente novamente.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-4">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-200">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Data/Hora</TableHead>
                  <TableHead className="font-semibold text-slate-700">Usuário</TableHead>
                  <TableHead className="font-semibold text-slate-700">Evento</TableHead>
                  <TableHead className="font-semibold text-slate-700">Ação</TableHead>
                  <TableHead className="font-semibold text-slate-700">Hash SHA-256</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">
                    Integridade
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.map((log) => {
                  const conf = getStatusConfig(log.status)
                  return (
                    <TableRow
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                    >
                      <TableCell className="text-sm text-slate-600 font-medium whitespace-nowrap">
                        {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">{log.user}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="font-medium bg-slate-100 text-slate-700"
                        >
                          {log.event}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{log.action}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-400">
                        {log.hash.substring(0, 16)}...
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${conf.bg} ${conf.color}`}
                        >
                          {conf.icon} {log.status}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-3 mb-4">
            {paginatedLogs.map((log) => {
              const conf = getStatusConfig(log.status)
              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                      <Clock className="h-3 w-3" />{' '}
                      {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')}
                    </span>
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${conf.bg} ${conf.color}`}
                    >
                      {conf.icon} {log.status}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <p className="font-semibold text-slate-900 text-sm">{log.user}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Badge variant="secondary" className="font-medium">
                      {log.event}
                    </Badge>
                    <span className="text-sm text-slate-600">{log.action}</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-sm font-medium text-slate-500">
              Total: {filteredLogs.length} registros
            </span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <span className="text-sm font-semibold text-slate-700">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        </>
      )}

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ShieldCheck className="h-6 w-6 text-primary" /> Detalhes do Log
            </DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase block mb-1">
                    Data/Hora
                  </span>
                  <span className="text-sm font-medium text-slate-900">
                    {format(new Date(selectedLog.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase block mb-1">
                    Usuário
                  </span>
                  <span className="text-sm font-medium text-slate-900">
                    {selectedLog.user} (ID: {selectedLog.userId})
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 col-span-2">
                  <span className="text-xs font-bold text-slate-500 uppercase block mb-1">
                    Evento e Ação
                  </span>
                  <span className="text-sm font-medium text-slate-900">
                    {selectedLog.event} &rarr; {selectedLog.action}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5 mb-2">
                  <Hash className="h-4 w-4" /> Hash Chain
                </span>
                <div className="space-y-2">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                      Hash Atual (SHA-256)
                    </span>
                    <span className="text-xs font-mono text-emerald-400 break-all leading-tight">
                      {selectedLog.hash}
                    </span>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                      Hash Anterior
                    </span>
                    <span className="text-xs font-mono text-slate-300 break-all leading-tight">
                      {selectedLog.prevHash}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-500 uppercase block mb-2">
                  Payload do Evento
                </span>
                <ScrollArea className="h-[120px] w-full rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.payload, null, 2)}
                  </pre>
                </ScrollArea>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="w-full md:w-auto font-semibold"
                  variant={
                    selectedLog.status === 'Corrompido' && !verifying && verifyStatus
                      ? 'destructive'
                      : 'default'
                  }
                >
                  {verifying ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 mr-2" />
                  )}
                  Verificar Integridade do Bloco
                </Button>

                {verifyStatus === 'success' && (
                  <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 animate-fade-in">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span className="text-sm font-medium text-emerald-800">
                      Verificação concluída: O hash confere com a cadeia de blocos. O registro está
                      íntegro e autêntico.
                    </span>
                  </div>
                )}

                {verifyStatus === 'error' && (
                  <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-3 animate-fade-in">
                    <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
                    <span className="text-sm font-medium text-rose-800">
                      Falha na verificação: Inconsistência detectada no hash. O registro pode ter
                      sido adulterado ou corrompido.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

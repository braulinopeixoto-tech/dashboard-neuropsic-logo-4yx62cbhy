import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useAuth } from '@/hooks/use-auth'
import { getAuditLogsSystemList, verifyAuditLogIntegrity } from '@/services/audit_logs_system'
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
  FileDown,
} from 'lucide-react'
import { ExportPdfModal } from '@/components/ExportPdfModal'
import { ExportCsvModal } from '@/components/ExportCsvModal'

const ITEMS_PER_PAGE = 20

const eventTypeLabel = (type: string) => {
  switch (type) {
    case 'login':
      return 'Login'
    case 'vital_score':
      return 'Vital Score'
    case 'acesso_prontuario':
      return 'Acesso Prontuário'
    default:
      return type
  }
}

export default function Auditoria() {
  const { user } = useAuth()
  const isAdmin = user?.tipo === 'neuropsicólogo'

  const [usersList] = useState<string[]>([
    'Todos',
    'Ana Silva',
    'Carlos Oliveira',
    'Mariana Santos',
  ])

  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  const [tempEventType, setTempEventType] = useState('Todos')
  const [tempUserFilter, setTempUserFilter] = useState('Todos')
  const [tempStartDate, setTempStartDate] = useState('')
  const [tempEndDate, setTempEndDate] = useState('')

  const [activeFilters, setActiveFilters] = useState({
    eventType: 'Todos',
    userFilter: 'Todos',
    startDate: '',
    endDate: '',
  })

  const [logs, setLogs] = useState<any[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const [selectedLog, setSelectedLog] = useState<any | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [verifyStatus, setVerifyStatus] = useState<'success' | 'error' | null>(null)
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false)
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false)

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const result = await getAuditLogsSystemList(currentPage, ITEMS_PER_PAGE, {
        event_type: activeFilters.eventType,
        userName: activeFilters.userFilter,
        startDate: activeFilters.startDate,
        endDate: activeFilters.endDate,
      })
      setLogs(result.items)
      setTotalPages(result.totalPages)
      setTotalItems(result.totalItems)
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [currentPage, activeFilters])

  const applyFilters = () => {
    setActiveFilters({
      eventType: tempEventType,
      userFilter: tempUserFilter,
      startDate: tempStartDate,
      endDate: tempEndDate,
    })
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setTempEventType('Todos')
    setTempUserFilter('Todos')
    setTempStartDate('')
    setTempEndDate('')
    setActiveFilters({
      eventType: 'Todos',
      userFilter: 'Todos',
      startDate: '',
      endDate: '',
    })
    setCurrentPage(1)
  }

  const handleVerify = async () => {
    if (!selectedLog) return

    setVerifying(true)
    setVerifyStatus(null)
    try {
      const response = await verifyAuditLogIntegrity(selectedLog.id)
      setVerifyStatus(response.integrity_status === 'corrupted' ? 'error' : 'success')

      setSelectedLog((prev: any) => ({
        ...prev,
        integrity_status: response.integrity_status,
        hash_recalculated: response.hash_recalculated,
        verified_at: response.verified_at,
      }))

      setLogs((prev) =>
        prev.map((log) =>
          log.id === selectedLog.id
            ? {
                ...log,
                integrity_status: response.integrity_status,
                verified_at: response.verified_at,
              }
            : log,
        ),
      )
    } catch (error) {
      console.error('Failed to verify integrity:', error)
      setVerifyStatus('error')
    } finally {
      setVerifying(false)
    }
  }

  useEffect(() => {
    if (!selectedLog) {
      setVerifyStatus(null)
      setVerifying(false)
    }
  }, [selectedLog])

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'valid':
        return {
          icon: <CheckCircle2 className="h-4 w-4" />,
          color: 'text-emerald-600',
          bg: 'bg-emerald-50 border-emerald-200',
          label: 'Íntegro',
        }
      case 'pending':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          color: 'text-amber-600',
          bg: 'bg-amber-50 border-amber-200',
          label: 'Pendente',
        }
      case 'corrupted':
        return {
          icon: <XCircle className="h-4 w-4" />,
          color: 'text-rose-600',
          bg: 'bg-rose-50 border-rose-200',
          label: 'Corrompido',
        }
      default:
        return {
          icon: <ShieldCheck className="h-4 w-4" />,
          color: 'text-slate-600',
          bg: 'bg-slate-50 border-slate-200',
          label: 'Desconhecido',
        }
    }
  }

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-primary" /> Auditoria de Logs
          </h1>
          <p className="text-slate-500 mt-1">
            Monitoramento de integridade e histórico de eventos do sistema.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setIsCsvModalOpen(true)} className="gap-2">
            <FileDown className="w-4 h-4" />
            Exportar CSV
          </Button>
          <Button onClick={() => setIsPdfModalOpen(true)} className="gap-2">
            <FileDown className="w-4 h-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <ExportCsvModal
        open={isCsvModalOpen}
        onOpenChange={setIsCsvModalOpen}
        defaultStartDate={activeFilters.startDate}
        defaultEndDate={activeFilters.endDate}
        filters={{
          eventType: activeFilters.eventType,
          userName: activeFilters.userFilter,
        }}
      />

      <ExportPdfModal
        open={isPdfModalOpen}
        onOpenChange={setIsPdfModalOpen}
        logs={logs}
        filters={{
          startDate: activeFilters.startDate,
          endDate: activeFilters.endDate,
          eventType: activeFilters.eventType,
          userFilter: activeFilters.userFilter,
        }}
        kpis={{
          total: totalItems,
          integrityRate:
            logs.length > 0
              ? (logs.filter((l) => l.integrity_status === 'valid').length / logs.length) * 100
              : 0,
          alerts: logs.filter((l) => l.integrity_status === 'corrupted').length,
        }}
      />

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
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="vital_score">Vital Score</SelectItem>
              <SelectItem value="acesso_prontuario">Acesso Prontuário</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Usuário
          </label>
          <Select value={tempUserFilter} onValueChange={setTempUserFilter} disabled={!isAdmin}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {usersList.map((u) => (
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
      ) : logs.length === 0 ? (
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
                {logs.map((log) => {
                  const conf = getStatusConfig(log.integrity_status)
                  return (
                    <TableRow
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                    >
                      <TableCell className="text-sm text-slate-600 font-medium whitespace-nowrap">
                        {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {log.expand?.usuario_id?.name || 'Desconhecido'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="font-medium bg-slate-100 text-slate-700"
                        >
                          {eventTypeLabel(log.event_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {log.action_description}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-400">
                        {log.hash_sha256?.substring(0, 16)}...
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${conf.bg} ${conf.color}`}
                        >
                          {conf.icon} {conf.label}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-3 mb-4">
            {logs.map((log) => {
              const conf = getStatusConfig(log.integrity_status)
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
                      {conf.icon} {conf.label}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <p className="font-semibold text-slate-900 text-sm">
                      {log.expand?.usuario_id?.name || 'Desconhecido'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Badge variant="secondary" className="font-medium">
                      {eventTypeLabel(log.event_type)}
                    </Badge>
                    <span className="text-sm text-slate-600">{log.action_description}</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-sm font-medium text-slate-500">
              Total: {totalItems} registros
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
                Página {currentPage} de {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages || totalPages === 0}
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
                    {selectedLog.expand?.usuario_id?.name || 'Desconhecido'} (ID:{' '}
                    {selectedLog.usuario_id})
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 col-span-2">
                  <span className="text-xs font-bold text-slate-500 uppercase block mb-1">
                    Evento e Ação
                  </span>
                  <span className="text-sm font-medium text-slate-900">
                    {eventTypeLabel(selectedLog.event_type)} &rarr; {selectedLog.action_description}
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
                      Hash Armazenado (SHA-256)
                    </span>
                    <span className="text-xs font-mono text-emerald-400 break-all leading-tight">
                      {selectedLog.hash_sha256}
                    </span>
                  </div>
                  {selectedLog.hash_recalculated && (
                    <div
                      className={`p-3 rounded-lg border ${selectedLog.hash_recalculated === selectedLog.hash_sha256 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}
                    >
                      <span
                        className={`text-[10px] font-bold uppercase block mb-0.5 ${selectedLog.hash_recalculated === selectedLog.hash_sha256 ? 'text-emerald-600' : 'text-rose-600'}`}
                      >
                        Hash Recalculado
                      </span>
                      <span
                        className={`text-xs font-mono break-all leading-tight ${selectedLog.hash_recalculated === selectedLog.hash_sha256 ? 'text-emerald-700' : 'text-rose-700'}`}
                      >
                        {selectedLog.hash_recalculated}
                      </span>
                    </div>
                  )}
                  <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                      Hash Anterior
                    </span>
                    <span className="text-xs font-mono text-slate-300 break-all leading-tight">
                      {selectedLog.previous_hash}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-500 uppercase block mb-2">
                  Payload do Evento
                </span>
                {selectedLog.event_type === 'vital_score' &&
                selectedLog.payload?.vital_score_novo !== undefined ? (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Valor Anterior
                      </span>
                      <span className="text-lg font-bold text-slate-600">
                        {selectedLog.payload.vital_score_anterior}
                      </span>
                    </div>
                    <div className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                      <span className="text-[10px] font-bold text-blue-500 uppercase block mb-1">
                        Novo Valor
                      </span>
                      <span className="text-lg font-bold text-blue-700">
                        {selectedLog.payload.vital_score_novo}
                      </span>
                    </div>
                    {selectedLog.payload.motivo_alteracao && (
                      <div className="col-span-2 border border-slate-200 rounded-lg p-3 bg-white">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          Motivo da Alteração
                        </span>
                        <span className="text-sm text-slate-700">
                          {selectedLog.payload.motivo_alteracao}
                        </span>
                      </div>
                    )}
                  </div>
                ) : null}
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
                    selectedLog.integrity_status === 'corrupted' && !verifying && verifyStatus
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

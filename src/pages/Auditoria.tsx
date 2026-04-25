import { useState, useEffect } from 'react'
import { getAuditLogs } from '@/services/audit_log'
import { useAuth } from '@/hooks/use-auth'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, FileDiff } from 'lucide-react'
import { AuditHistoryModal } from '@/components/audit/AuditHistoryModal'

export default function Auditoria() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('todos')

  const [modalState, setModalState] = useState<{ open: boolean; type: string; id: string }>({
    open: false,
    type: '',
    id: '',
  })

  useEffect(() => {
    if (user?.tipo !== 'neuropsicólogo') return

    setLoading(true)
    getAuditLogs(filterType !== 'todos' ? { entity_type: filterType } : {}).then((res) => {
      setLogs(res)
      setLoading(false)
    })
  }, [user, filterType])

  if (user?.tipo !== 'neuropsicólogo') {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Acesso restrito a neuropsicólogos.
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up pb-12">
      <div className="mb-[32px] flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <ShieldCheck className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-slate-900">
            Painel de Auditoria
          </h1>
          <p className="text-[14px] text-muted-foreground mt-1 font-medium">
            Trust Layer™ - Monitoramento de Integridade e Histórico
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-64 bg-white font-medium shadow-sm">
            <SelectValue placeholder="Tipo de Entidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas Entidades</SelectItem>
            <SelectItem value="DNDA">DNDA</SelectItem>
            <SelectItem value="protocolo">Protocolos</SelectItem>
            <SelectItem value="sessao">Sessões</SelectItem>
            <SelectItem value="alerta">Alertas</SelectItem>
            <SelectItem value="intervencao">Intervenções</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="font-semibold text-slate-700">Data/Hora</TableHead>
              <TableHead className="font-semibold text-slate-700">Entidade</TableHead>
              <TableHead className="font-semibold text-slate-700">Ação</TableHead>
              <TableHead className="font-semibold text-slate-700">Resumo</TableHead>
              <TableHead className="font-semibold text-slate-700">Hash de Integridade</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  Carregando auditoria...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  Nenhum registro encontrado para este filtro.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="text-[14px] text-slate-600 font-medium">
                    {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize shadow-sm bg-white font-medium">
                      {log.entity_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-[12px] font-bold px-2 py-1 rounded-md shadow-sm border ${
                        log.action === 'create'
                          ? 'bg-success/10 text-success border-success/20'
                          : log.action === 'update'
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-error/10 text-error border-error/20'
                      }`}
                    >
                      {log.action.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell
                    className="text-[14px] font-medium text-slate-900 max-w-[200px] truncate"
                    title={log.change_summary}
                  >
                    {log.change_summary}
                  </TableCell>
                  <TableCell
                    className="font-mono text-[12px] text-slate-400 max-w-[150px] truncate"
                    title={log.hash_integrity}
                  >
                    {log.hash_integrity.substring(0, 24)}...
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="font-semibold text-slate-600 hover:text-primary"
                      onClick={() =>
                        setModalState({ open: true, type: log.entity_type, id: log.entity_id })
                      }
                    >
                      <FileDiff className="h-4 w-4 mr-2" /> Histórico
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AuditHistoryModal
        open={modalState.open}
        onOpenChange={(open) => setModalState((prev) => ({ ...prev, open }))}
        entityType={modalState.type}
        entityId={modalState.id}
      />
    </div>
  )
}

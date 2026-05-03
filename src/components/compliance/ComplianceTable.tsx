import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'valid') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
  if (status === 'pending') return <AlertTriangle className="w-4 h-4 text-amber-500" />
  if (status === 'corrupted') return <XCircle className="w-4 h-4 text-rose-500" />
  return null
}

export function ComplianceTable({ logs, loading }: { logs: any[]; loading: boolean }) {
  const [selectedLog, setSelectedLog] = useState<any>(null)

  if (loading) return <Skeleton className="h-96 w-full" />

  const recentLogs = logs.slice(0, 10)

  return (
    <Card>
      <CardHeader>
        <CardTitle>10 Logs Mais Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        {recentLogs.length === 0 ? (
          <div className="text-center py-8 text-slate-500">Nenhum log registrado ainda</div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLogs.map((log) => (
                  <TableRow
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {log.expand?.usuario_id?.name || 'Desconhecido'}
                    </TableCell>
                    <TableCell className="capitalize whitespace-nowrap">
                      {log.event_type?.replace('_', ' ')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <StatusIcon status={log.integrity_status} />
                        <span className="capitalize">{log.integrity_status}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Log de Auditoria</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4 text-sm pr-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="font-semibold text-slate-500 block">Data/Hora</span>{' '}
                    {format(new Date(selectedLog.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">Usuário</span>{' '}
                    {selectedLog.expand?.usuario_id?.name || 'Desconhecido'}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">Evento</span>{' '}
                    <span className="capitalize">{selectedLog.event_type?.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">
                      Status de Integridade
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusIcon status={selectedLog.integrity_status} />
                      <span className="capitalize">{selectedLog.integrity_status}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block">Hash Atual (SHA256)</span>
                  <p className="font-mono bg-slate-100 p-2 rounded break-all mt-1">
                    {selectedLog.hash_sha256 || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block">Hash Anterior</span>
                  <p className="font-mono bg-slate-100 p-2 rounded break-all mt-1">
                    {selectedLog.previous_hash || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block">Payload</span>
                  <pre className="bg-slate-900 text-slate-50 p-4 rounded-md mt-1 overflow-x-auto text-xs">
                    {JSON.stringify(selectedLog.payload, null, 2)}
                  </pre>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getEntityAuditLogs } from '@/services/audit_log'
import { format } from 'date-fns'
import { FileDiff, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function AuditHistoryModal({
  open,
  onOpenChange,
  entityType,
  entityId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: string
  entityId: string
}) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [comparing, setComparing] = useState<any | null>(null)

  useEffect(() => {
    if (open && entityId) {
      setLoading(true)
      getEntityAuditLogs(entityType, entityId).then((res) => {
        setLogs(res)
        setLoading(false)
      })
    }
  }, [open, entityId, entityType])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[24px]">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Histórico da Entidade (Trust Layer™)
          </DialogTitle>
        </DialogHeader>

        {comparing ? (
          <div className="space-y-4 flex flex-col flex-1 overflow-hidden mt-4">
            <div className="shrink-0">
              <Button variant="ghost" onClick={() => setComparing(null)} className="h-8">
                ← Voltar ao histórico
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col h-full shadow-sm">
                <h4 className="font-semibold text-[14px] mb-2 shrink-0 border-b pb-2">
                  Valores Anteriores (v{comparing.version - 1})
                </h4>
                <ScrollArea className="flex-1 pr-2">
                  <pre className="text-xs whitespace-pre-wrap font-mono py-2 text-slate-600">
                    {JSON.stringify(comparing.old_values, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
              <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50/50 flex flex-col h-full shadow-sm">
                <h4 className="font-semibold text-[14px] mb-2 shrink-0 border-b border-yellow-200 pb-2">
                  Novos Valores (v{comparing.version})
                </h4>
                <ScrollArea className="flex-1 pr-2">
                  <pre className="text-xs whitespace-pre-wrap font-mono py-2 text-slate-900">
                    {JSON.stringify(comparing.new_values, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4 mt-4">
            {loading ? (
              <p className="text-[14px] text-slate-500 text-center py-8">Carregando histórico...</p>
            ) : logs.length === 0 ? (
              <p className="text-[14px] text-slate-500 text-center py-8">
                Nenhum registro encontrado.
              </p>
            ) : (
              <div className="space-y-4 pl-2 border-l-2 border-slate-100 ml-4 py-2">
                {logs.map((log) => (
                  <div key={log.id} className="relative pl-6">
                    <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-4 ring-4 ring-white" />
                    <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3 hover:shadow-subtle transition-shadow">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className="font-mono text-xs shadow-sm bg-slate-50"
                        >
                          v{log.version}
                        </Badge>
                        <time className="text-[12px] font-medium text-slate-500">
                          {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')}
                        </time>
                      </div>
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            'text-[12px] font-semibold px-2 py-0.5 rounded-full mt-0.5',
                            {
                              'bg-success/10 text-success': log.action === 'create',
                              'bg-primary/10 text-primary': log.action === 'update',
                              'bg-error/10 text-error': log.action === 'delete',
                            },
                          )}
                        >
                          {log.action.toUpperCase()}
                        </span>
                        <p className="text-[14px] font-semibold text-slate-900">
                          {log.change_summary}
                        </p>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-2">
                        <p className="text-[12px] text-slate-500 font-medium">
                          Autor: {log.expand?.author_id?.name || log.author_id || 'Sistema'}
                        </p>
                        {log.action === 'update' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-semibold shadow-sm"
                            onClick={() => setComparing(log)}
                          >
                            <FileDiff className="h-3 w-3 mr-1.5" /> Comparar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}

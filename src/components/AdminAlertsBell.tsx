import { useState, useEffect } from 'react'
import { ShieldAlert, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  getAdminAlerts,
  markAdminAlertAsRead,
  markAllAdminAlertsAsRead,
} from '@/services/admin_alerts'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export function AdminAlertsBell() {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const loadAlerts = async () => {
    if (!user) return
    try {
      const res = await getAdminAlerts(user.id)
      setAlerts(res)
      setError('')
    } catch (e) {
      console.error(e)
      setError('Erro ao carregar alertas. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlerts()
  }, [user])

  useRealtime('admin_alerts', () => {
    loadAlerts()
  })

  const unreadCount = alerts.filter((a) => !a.lido).length
  const unreadAlerts = alerts.filter((a) => !a.lido)
  const readAlerts = alerts.filter((a) => a.lido)

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAdminAlertAsRead(id)
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, lido: true } : a)))
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o alerta',
        variant: 'destructive',
      })
    }
  }

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return
    try {
      await markAllAdminAlertsAsRead(user.id)
      setAlerts((prev) => prev.map((a) => ({ ...a, lido: true })))
      toast({ title: 'Sucesso', description: 'Todos os alertas marcados como lidos' })
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar os alertas',
        variant: 'destructive',
      })
    }
  }

  const triggerBtn = (
    <Button variant="ghost" size="icon" className="relative">
      <ShieldAlert
        className={cn('h-5 w-5', unreadCount > 0 ? 'text-rose-600' : 'text-slate-600')}
      />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white border-2 border-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Button>
  )

  const renderAlert = (alerta: any) => (
    <div
      key={alerta.id}
      className={cn(
        'flex flex-col gap-2 p-3 border rounded-lg transition-colors',
        alerta.lido ? 'bg-slate-50 border-slate-100' : 'bg-rose-50 border-rose-100',
      )}
    >
      <div className="flex justify-between items-start">
        <span
          className={cn('font-medium text-sm', alerta.lido ? 'text-slate-700' : 'text-rose-900')}
        >
          {alerta.tipo_alerta === 'corrupted' ? 'Fraude Detectada' : 'Atividade Suspeita'}
        </span>
        <span className="text-[10px] text-slate-500 whitespace-nowrap">
          {formatDistanceToNow(new Date(alerta.created), { addSuffix: true, locale: ptBR })}
        </span>
      </div>

      <div className="text-xs space-y-1 text-slate-600">
        <p>{alerta.mensagem}</p>
        {alerta.expand?.log_id && (
          <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 bg-white/50 p-2 rounded text-[10px] font-mono">
            <span className="text-slate-500">Log ID:</span>
            <span className="truncate">{alerta.expand.log_id.id}</span>
            <span className="text-slate-500">Evento:</span>
            <span>{alerta.expand.log_id.event_type}</span>
            <span className="text-slate-500">Usuário:</span>
            <span className="truncate">
              {alerta.expand.log_id.expand?.usuario_id?.name || alerta.expand.log_id.usuario_id}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200/50">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-7 text-xs flex-1"
          onClick={() => setOpen(false)}
        >
          <Link to={`/compliance`}>Ver Log</Link>
        </Button>
        {!alerta.lido && (
          <Button
            variant="secondary"
            size="sm"
            className="h-7 text-xs flex-1 gap-1"
            onClick={() => handleMarkAsRead(alerta.id)}
          >
            <CheckCircle2 className="h-3 w-3" /> Lido
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{triggerBtn}</SheetTrigger>
      <SheetContent side="right" className="w-[85vw] sm:w-[400px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-slate-100 text-left flex flex-row items-center justify-between">
          <SheetTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-600" />
            Alertas de Segurança
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-auto p-4 space-y-6">
          {error && <div className="text-sm text-rose-500 p-3 bg-rose-50 rounded-lg">{error}</div>}

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center text-slate-500 py-10">Nenhum alerta de segurança.</div>
          ) : (
            <>
              {unreadAlerts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Não Lidos ({unreadCount})
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] text-slate-500 hover:text-slate-900 px-2"
                      onClick={handleMarkAllAsRead}
                    >
                      Marcar todos lidos
                    </Button>
                  </div>
                  <div className="space-y-2">{unreadAlerts.map(renderAlert)}</div>
                </div>
              )}

              {readAlerts.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-500">Lidos</h3>
                  <div className="space-y-2 opacity-75">{readAlerts.map(renderAlert)}</div>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

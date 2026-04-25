import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { getAlertasNaoLidos } from '@/services/alertas'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { Link } from 'react-router-dom'
import { useIsMobile } from '@/hooks/use-mobile'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function NotificationBell() {
  const { user } = useAuth()
  const [alertas, setAlertas] = useState<any[]>([])
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)

  const loadAlertas = async () => {
    if (!user) return
    try {
      const res = await getAlertasNaoLidos(user.id)
      setAlertas(res)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadAlertas()
  }, [user])

  useRealtime('alertas', () => {
    loadAlertas()
  })

  const triggerBtn = (
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="h-5 w-5 text-slate-600" />
      {alertas.length > 0 && (
        <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-error border-2 border-white" />
      )}
    </Button>
  )

  const alertItems =
    alertas.length === 0 ? (
      <div className="p-4 text-center text-sm text-muted-foreground">Nenhum alerta não lido.</div>
    ) : (
      alertas.slice(0, 5).map((alerta) => (
        <div
          key={alerta.id}
          className="flex flex-col items-start gap-1 p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
        >
          <Link to="/alertas" onClick={() => setOpen(false)} className="w-full">
            <span className="font-medium text-sm text-slate-900 block">
              {alerta.expand?.paciente_id?.nome || 'Paciente'}
            </span>
            <span className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {alerta.mensagem}
            </span>
            <span className="text-[10px] text-slate-400 mt-1.5 block">
              {formatDistanceToNow(new Date(alerta.created), { addSuffix: true, locale: ptBR })}
            </span>
          </Link>
        </div>
      ))
    )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{triggerBtn}</SheetTrigger>
        <SheetContent side="right" className="w-[85vw] sm:w-[400px] p-0 flex flex-col">
          <SheetHeader className="p-4 border-b border-slate-100 text-left">
            <SheetTitle>Alertas ({alertas.length})</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-auto">{alertItems}</div>
          <div className="p-4 border-t border-slate-100 mt-auto">
            <Button asChild variant="outline" className="w-full" onClick={() => setOpen(false)}>
              <Link to="/alertas">Ver todos</Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{triggerBtn}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="p-3 border-b border-slate-100">
          <DropdownMenuLabel className="p-0 font-semibold text-slate-900">
            Alertas ({alertas.length})
          </DropdownMenuLabel>
        </div>
        <div className="max-h-[350px] overflow-auto">{alertItems}</div>
        <div className="p-2 border-t border-slate-100">
          <DropdownMenuItem
            asChild
            className="w-full text-center text-primary font-medium cursor-pointer justify-center"
            onClick={() => setOpen(false)}
          >
            <Link to="/alertas">Ver todos</Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

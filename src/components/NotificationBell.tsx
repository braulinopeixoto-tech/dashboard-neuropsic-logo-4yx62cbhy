import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getAlertasNaoLidos } from '@/services/alertas'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { Link } from 'react-router-dom'

export function NotificationBell() {
  const { user } = useAuth()
  const [alertas, setAlertas] = useState<any[]>([])

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-slate-600" />
          {alertas.length > 0 && (
            <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-600 border-2 border-white" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Alertas ({alertas.length})</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-auto">
          {alertas.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhum alerta não lido.
            </div>
          ) : (
            alertas.slice(0, 5).map((alerta) => (
              <DropdownMenuItem
                key={alerta.id}
                className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                asChild
              >
                <Link to="/alertas">
                  <span className="font-medium text-sm">
                    {alerta.expand?.paciente_id?.nome || 'Paciente'}
                  </span>
                  <span className="text-xs text-muted-foreground line-clamp-2">
                    {alerta.mensagem}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {new Date(alerta.created).toLocaleString('pt-BR')}
                  </span>
                </Link>
              </DropdownMenuItem>
            ))
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          asChild
          className="w-full text-center text-primary font-medium cursor-pointer"
        >
          <Link to="/alertas" className="w-full justify-center">
            Ver todos
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

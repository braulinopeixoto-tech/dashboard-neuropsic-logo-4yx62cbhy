import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Activity } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Patient } from '@/data/mock'
import { cn } from '@/lib/utils'

const statusStyles = {
  'Em dia': 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200',
  Atrasado: 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200',
  'Falta registrada': 'bg-rose-100 text-rose-800 hover:bg-rose-200 border-rose-200',
  'Risco de Desistência': 'bg-violet-100 text-violet-800 hover:bg-violet-200 border-violet-200',
}

const progressStyles = {
  'Em dia': 'bg-emerald-500',
  Atrasado: 'bg-amber-500',
  'Falta registrada': 'bg-rose-500',
  'Risco de Desistência': 'bg-violet-500',
}

export function PatientCard({ patient }: { patient: Patient }) {
  const progressPercent = Math.round((patient.progress / patient.totalSessions) * 100)

  return (
    <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-elevation hover:-translate-y-1 bg-white border-slate-200">
      <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-lg line-clamp-1 text-slate-900" title={patient.name}>
            {patient.name}
          </h3>
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-1 font-medium">
            <Activity className="w-3.5 h-3.5" />
            <span>{patient.protocol}</span>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn('whitespace-nowrap font-medium', statusStyles[patient.status])}
        >
          {patient.status}
        </Badge>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Progresso</span>
              <span className="font-semibold text-slate-700">
                {patient.progress}/{patient.totalSessions} sessões
              </span>
            </div>
            <Progress
              value={progressPercent}
              className="h-2 bg-slate-100"
              indicatorClassName={progressStyles[patient.status]}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="space-y-1 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                <Clock className="w-3.5 h-3.5" /> Última Sessão
              </div>
              <p className="font-medium text-slate-700 line-clamp-1" title={patient.lastSession}>
                {patient.lastSession}
              </p>
            </div>
            <div className="space-y-1 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                <Calendar className="w-3.5 h-3.5" /> Próxima
              </div>
              <p className="font-medium text-slate-700 line-clamp-1" title={patient.nextSession}>
                {patient.nextSession}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button
          variant="outline"
          className="w-full text-primary hover:text-primary hover:bg-primary/5 border-slate-200"
          asChild
        >
          <Link to={`/pacientes?id=${patient.id}`}>Ver detalhes do paciente</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

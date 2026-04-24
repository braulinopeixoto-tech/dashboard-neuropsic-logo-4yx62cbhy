import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Microscope } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Patient } from '@/data/mock'
import { cn } from '@/lib/utils'

const statusStyles = {
  'Em dia': 'bg-success/10 text-success hover:bg-success/20 border-success/20',
  Atrasado: 'bg-alert/10 text-alert hover:bg-alert/20 border-alert/20',
  'Falta registrada': 'bg-error/10 text-error hover:bg-error/20 border-error/20',
  'Risco de Desistência': 'bg-risk/10 text-risk hover:bg-risk/20 border-risk/20',
}

const progressStyles = {
  'Em dia': 'bg-success',
  Atrasado: 'bg-alert',
  'Falta registrada': 'bg-error',
  'Risco de Desistência': 'bg-risk',
}

export function PatientCard({ patient }: { patient: Patient }) {
  const progressPercent = Math.round((patient.progress / patient.totalSessions) * 100)

  return (
    <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-elevation hover:-translate-y-1 bg-white border-slate-200">
      <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
        <div>
          <h3
            className="text-[16px] font-semibold line-clamp-1 text-slate-900"
            title={patient.name}
          >
            {patient.name}
          </h3>
          <div className="flex items-center gap-1.5 text-muted-foreground text-[14px] font-normal mt-1">
            <Microscope className="w-3.5 h-3.5" />
            <span>{patient.protocol}</span>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn(
            'whitespace-nowrap transition-colors duration-200',
            statusStyles[patient.status],
          )}
        >
          {patient.status}
        </Badge>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-[14px] font-normal">
              <span className="text-muted-foreground">Progresso</span>
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

          <div className="grid grid-cols-2 gap-4 text-[14px]">
            <div className="space-y-1 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[14px] font-normal">
                <Clock className="w-3.5 h-3.5" /> Última Sessão
              </div>
              <p className="font-semibold text-slate-700 line-clamp-1" title={patient.lastSession}>
                {patient.lastSession}
              </p>
            </div>
            <div className="space-y-1 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[14px] font-normal">
                <Calendar className="w-3.5 h-3.5" /> Próxima
              </div>
              <p className="font-semibold text-slate-700 line-clamp-1" title={patient.nextSession}>
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
          <Link to={`/pacientes/${patient.id}`}>Ver detalhes do paciente</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

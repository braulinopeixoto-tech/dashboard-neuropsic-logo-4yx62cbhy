import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

export function PacienteHeader({ paciente }: { paciente: any }) {
  if (!paciente) return null
  const initials = paciente.nome
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-border shadow-subtle hover:shadow-elevation transition-all duration-200">
      <Avatar className="h-16 w-16 border-2 border-slate-100">
        <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-slate-900">{paciente.nome}</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-sm text-slate-600 font-normal">
          {paciente.email && <span>{paciente.email}</span>}
          {paciente.telefone && <span>{paciente.telefone}</span>}
          {paciente.data_nascimento && (
            <span>Nascimento: {format(new Date(paciente.data_nascimento), 'dd/MM/yyyy')}</span>
          )}
        </div>
      </div>
      <div>
        <Badge
          variant={paciente.ativo ? 'default' : 'secondary'}
          className={paciente.ativo ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50' : ''}
        >
          {paciente.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>
    </div>
  )
}

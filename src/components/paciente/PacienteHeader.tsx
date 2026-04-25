import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import pb from '@/lib/pocketbase/client'

export function PacienteHeader({ paciente }: { paciente: any }) {
  if (!paciente) return null
  const initials = paciente.nome
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  const avatarUrl = paciente.avatar ? pb.files.getURL(paciente, paciente.avatar) : ''

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-border shadow-subtle hover:shadow-elevation transition-all duration-200 animate-fade-in">
      <Avatar className="h-16 w-16 border-2 border-slate-100 transition-all duration-200">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={paciente.nome} />}
        <AvatarFallback className="bg-primary/10 text-primary text-[24px] font-bold">
          {initials || '👤'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <h1 className="text-[24px] font-bold text-slate-900">{paciente.nome}</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-[14px] text-slate-600 font-normal">
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
          className={
            paciente.ativo
              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50 transition-colors duration-200'
              : 'transition-colors duration-200'
          }
        >
          {paciente.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>
    </div>
  )
}

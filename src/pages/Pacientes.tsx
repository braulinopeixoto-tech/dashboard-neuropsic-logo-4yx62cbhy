import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Search, Activity, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useDashboardData } from '@/hooks/use-dashboard-data'

const statusStyles: Record<string, string> = {
  'Em dia': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Atrasado: 'bg-amber-50 text-amber-700 border-amber-200',
  'Falta registrada': 'bg-rose-50 text-rose-700 border-rose-200',
  'Risco de Desistência': 'bg-violet-50 text-violet-700 border-violet-200',
}

export default function Pacientes() {
  const [search, setSearch] = useState('')
  const { protocolos, sessoes, alertas } = useDashboardData()

  const patientsList = useMemo(() => {
    return protocolos
      .map((prot: any) => {
        const pt = prot.expand?.paciente_id
        if (!pt) return null

        const ptSessoes = sessoes.filter((s: any) => s.protocolo_id === prot.id)
        ptSessoes.sort(
          (a: any, b: any) =>
            new Date(a.data_agendada || a.created).getTime() -
            new Date(b.data_agendada || b.created).getTime(),
        )

        const ptAlertas = alertas.filter((a: any) => a.paciente_id === pt.id)
        const hasRisco = ptAlertas.some((a: any) => a.tipo === 'risco_desistência')
        let status = 'Em dia'

        const agendadas = ptSessoes.filter((s: any) => s.status === 'agendada')
        const lastSess = ptSessoes[ptSessoes.length - 1]

        if (hasRisco) status = 'Risco de Desistência'
        else if (lastSess && lastSess.status === 'faltou') status = 'Falta registrada'
        else if (agendadas.length > 0 && new Date(agendadas[0].data_agendada) < new Date())
          status = 'Atrasado'

        return {
          id: pt.id,
          name: pt.nome,
          protocol: prot.tipo,
          progress: prot.sessoes_concluidas || 0,
          totalSessions: prot.total_sessoes || 1,
          status,
        }
      })
      .filter(Boolean)
  }, [protocolos, sessoes, alertas])

  const filtered = patientsList.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pacientes</h1>
          <p className="text-muted-foreground mt-1">
            Gestão completa da base de pacientes e histórico de tratamentos.
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome..."
            className="pl-9 bg-white shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Paciente</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Protocolo</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Progresso</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((patient: any) => (
                <tr
                  key={patient.id}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">{patient.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                      <div className="p-1.5 bg-slate-100 rounded-md">
                        <Activity className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      {patient.protocol}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant="outline"
                      className={`font-medium whitespace-nowrap ${statusStyles[patient.status] || ''}`}
                    >
                      {patient.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {patient.progress}{' '}
                    <span className="text-slate-400 font-normal">de {patient.totalSessions}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-medium text-sm transition-colors group-hover:underline">
                      Prontuário <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-500 bg-slate-50/50">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-8 h-8 text-slate-300" />
                      <p>Nenhum paciente encontrado.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

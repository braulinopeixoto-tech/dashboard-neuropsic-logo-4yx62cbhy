import { useState, useMemo } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Users, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { StatCard } from '@/components/dashboard/StatCard'
import { PatientCard } from '@/components/dashboard/PatientCard'
import { statsData, alertsData, patientsData } from '@/data/mock'
import { Link } from 'react-router-dom'

export default function Index() {
  const { toast } = useToast()
  const [unit, setUnit] = useState<string>('all')

  const handleIntervention = (patientName: string) => {
    toast({
      title: 'Intervenção Registrada',
      description: `Notificação de risco enviada para a equipe do paciente ${patientName}.`,
    })
  }

  const filteredPatients = useMemo(() => {
    if (unit === 'all') return patientsData
    return patientsData.filter((_, i) => i % 2 === (unit === 'cidade-a' ? 0 : 1))
  }, [unit])

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-slate-900">Visão Geral</h1>
          <p className="text-[14px] font-normal text-muted-foreground mt-1">
            Acompanhamento clínico e gestão de protocolos de neuroestimulação.
          </p>
        </div>
        <div className="w-full sm:w-72">
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecione a unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Unidades</SelectItem>
              <SelectItem value="cidade-a">Unidade Cidade A</SelectItem>
              <SelectItem value="cidade-b">Unidade Cidade B</SelectItem>
              <SelectItem value="cidade-c">Unidade Cidade C</SelectItem>
              <SelectItem value="cidade-d">Unidade Cidade D</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-4">
        <StatCard
          title="Pacientes Ativos"
          value={statsData.totalActive}
          icon={Users}
          description="+4 este mês"
          className="animate-fade-in-up"
          style={{ animationDelay: '0.1s' }}
        />
        <StatCard
          title="Taxa de Conclusão"
          value={`${statsData.completionRate}%`}
          icon={CheckCircle2}
          description="Média geral das unidades"
          className="animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        />
        <StatCard
          title="Faltas Registradas"
          value={statsData.missedSessions}
          icon={XCircle}
          description="Neste mês atual"
          className="animate-fade-in-up"
          style={{ animationDelay: '0.3s' }}
        />
        <StatCard
          title="Desistências Evitadas"
          value={statsData.avoidedDropouts}
          icon={CheckCircle2}
          description="Através de intervenção rápida"
          className="animate-fade-in-up"
          style={{ animationDelay: '0.4s' }}
        />
      </div>

      {alertsData.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-[24px] font-bold flex items-center gap-2 text-slate-800">
            <AlertTriangle className="w-6 h-6 text-alert" /> Alertas Clínicos
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {alertsData.map((alert) => (
              <Alert
                key={alert.id}
                className={`border-l-4 bg-white shadow-sm transition-all hover:shadow-md ${alert.type === 'danger' ? 'border-l-error' : 'border-l-alert'}`}
              >
                <AlertTriangle
                  className={`h-5 w-5 ${alert.type === 'danger' ? 'text-error' : 'text-alert'}`}
                />
                <AlertTitle className="text-[16px] font-semibold text-slate-900">
                  {alert.patient}
                </AlertTitle>
                <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3">
                  <span className="text-[14px] font-normal text-slate-600">{alert.message}</span>
                  <Button
                    size="sm"
                    variant={alert.type === 'danger' ? 'destructive' : 'outline'}
                    className={
                      alert.type !== 'danger'
                        ? 'border-alert text-amber-700 hover:bg-amber-50 hover:text-amber-800'
                        : ''
                    }
                    onClick={() => handleIntervention(alert.patient)}
                  >
                    Intervir
                  </Button>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[24px] font-bold text-slate-800">Acompanhamento de Pacientes</h2>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-5 text-center border rounded-xl bg-white border-dashed border-slate-300">
            <Users className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-[16px] font-semibold text-slate-700">Nenhum paciente ativo</h3>
            <p className="text-[14px] font-normal text-muted-foreground mb-6 max-w-sm">
              Não há pacientes correspondentes aos filtros selecionados nesta unidade.
            </p>
            <Button asChild>
              <Link to="/prescrever">Prescrever Novo Tratamento</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPatients.map((patient, index) => (
              <div
                key={patient.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${Math.min(0.1 * (index + 1), 0.8)}s` }}
              >
                <PatientCard patient={patient} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

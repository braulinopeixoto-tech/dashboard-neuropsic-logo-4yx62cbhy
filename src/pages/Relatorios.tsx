import { useState, useEffect, useMemo } from 'react'
import pb from '@/lib/pocketbase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { RefreshCw, BarChart3, Users, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RelatoriosFiltros } from './relatorios/Filtros'
import { RelatoriosResumo } from './relatorios/Resumo'
import { RelatoriosPacientes } from './relatorios/Pacientes'
import { RelatoriosProtocolos } from './relatorios/Protocolos'

export default function Relatorios() {
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  })
  const [unidade, setUnidade] = useState('todas')
  const [protocolo, setProtocolo] = useState('todos')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [rawData, setRawData] = useState({
    protocolos: [] as any[],
    sessoes: [] as any[],
    alertas: [] as any[],
    pacientes: [] as any[],
  })

  const loadData = async () => {
    try {
      setLoading(true)
      setError(false)
      const [protocolos, sessoes, alertas, pacientes] = await Promise.all([
        pb.collection('protocolos').getFullList({ expand: 'paciente_id' }),
        pb.collection('sessoes').getFullList({ expand: 'protocolo_id,paciente_id' }),
        pb.collection('alertas').getFullList({ expand: 'protocolo_id' }),
        pb.collection('pacientes').getFullList(),
      ])
      setRawData({ protocolos, sessoes, alertas, pacientes })
    } catch (err) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredData = useMemo(() => {
    const start = new Date(dateRange.start)
    const end = new Date(dateRange.end)
    const isDateInRange = (dateStr: string) => {
      if (!dateStr) return false
      const d = new Date(dateStr)
      return d >= start && d <= end
    }

    const pacientes = rawData.pacientes.filter((p) => unidade === 'todas' || p.unidade === unidade)
    const pIds = new Set(pacientes.map((p) => p.id))

    const protocolos = rawData.protocolos.filter((p) => {
      if (!pIds.has(p.paciente_id)) return false
      if (protocolo !== 'todos' && p.tipo !== protocolo) return false
      return true
    })
    const protoIds = new Set(protocolos.map((p) => p.id))

    const sessoes = rawData.sessoes.filter(
      (s) =>
        protoIds.has(s.protocolo_id) &&
        isDateInRange(s.data_realizada || s.data_agendada || s.created),
    )
    const alertas = rawData.alertas.filter(
      (a) => pIds.has(a.paciente_id) && isDateInRange(a.created),
    )

    return { pacientes, protocolos, sessoes, alertas }
  }, [rawData, dateRange, unidade, protocolo])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-2">
          <RefreshCw className="h-8 w-8 text-rose-500" />
        </div>
        <p className="text-slate-600 font-medium text-lg">Erro ao carregar relatórios</p>
        <p className="text-slate-500 text-sm max-w-sm text-center">
          Ocorreu um problema ao conectar com o banco de dados. Por favor, tente novamente.
        </p>
        <Button onClick={loadData} variant="default" className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" /> Tentar Novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Relatórios e Estatísticas
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Monitore o desempenho clínico e o progresso dos seus pacientes.
          </p>
        </div>
      </div>

      <RelatoriosFiltros
        dateRange={dateRange}
        setDateRange={setDateRange}
        unidade={unidade}
        setUnidade={setUnidade}
        protocolo={protocolo}
        setProtocolo={setProtocolo}
        pacientes={rawData.pacientes}
        disabled={loading}
      />

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-[380px] w-full rounded-xl" />
            <Skeleton className="h-[380px] w-full rounded-xl" />
          </div>
        </div>
      ) : (
        <Tabs defaultValue="resumo" className="space-y-6">
          <TabsList className="bg-white border border-slate-200 shadow-sm w-full md:w-auto inline-flex overflow-x-auto rounded-xl p-1">
            <TabsTrigger
              value="resumo"
              className="rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-primary px-6 py-2"
            >
              Resumo Geral
            </TabsTrigger>
            <TabsTrigger
              value="pacientes"
              className="rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-primary px-6 py-2 flex items-center gap-2"
            >
              <Users className="h-4 w-4" /> Pacientes
            </TabsTrigger>
            <TabsTrigger
              value="protocolos"
              className="rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-primary px-6 py-2 flex items-center gap-2"
            >
              <Settings className="h-4 w-4" /> Protocolos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="mt-0">
            <RelatoriosResumo data={filteredData} rawData={rawData} />
          </TabsContent>
          <TabsContent value="pacientes" className="mt-0">
            <RelatoriosPacientes data={filteredData} rawData={rawData} />
          </TabsContent>
          <TabsContent value="protocolos" className="mt-0">
            <RelatoriosProtocolos data={filteredData} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

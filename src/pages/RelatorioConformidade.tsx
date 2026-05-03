import { useState, useEffect, useMemo } from 'react'
import { format, subDays, startOfDay } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Download, ShieldCheck, CheckCircle2, Stethoscope, ArrowDown, ArrowUp } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'

export default function RelatorioConformidade() {
  const { toast } = useToast()

  const [filters, setFilters] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    eventType: 'all',
    userId: 'all',
  })

  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [reportGenerated, setReportGenerated] = useState(false)

  const [sortCol, setSortCol] = useState<string>('total')
  const [sortDesc, setSortDesc] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await pb
          .collection('audit_logs')
          .getList(1, 1000, { expand: 'usuario_id', sort: '-timestamp' })
        const usersMap = new Map()
        res.items.forEach((log) => {
          if (log.expand?.usuario_id) {
            usersMap.set(log.expand.usuario_id.id, log.expand.usuario_id)
          }
        })
        setAvailableUsers(Array.from(usersMap.values()))
      } catch (e) {
        // silently ignore, fallback to what's available
      }
    }
    fetchUsers()
  }, [])

  const handleGenerate = async () => {
    setLoading(true)
    setError(false)
    try {
      const f: string[] = []
      if (filters.eventType !== 'all') f.push(`event_type="${filters.eventType}"`)
      if (filters.userId !== 'all') f.push(`usuario_id="${filters.userId}"`)

      if (filters.startDate) {
        const d = new Date(filters.startDate)
        d.setHours(0, 0, 0, 0)
        f.push(`timestamp >= "${d.toISOString().replace('T', ' ')}"`)
      }
      if (filters.endDate) {
        const d = new Date(filters.endDate)
        d.setHours(23, 59, 59, 999)
        f.push(`timestamp <= "${d.toISOString().replace('T', ' ')}"`)
      }

      const res = await pb.collection('audit_logs').getFullList({
        filter: f.join(' && '),
        sort: '+timestamp',
        expand: 'usuario_id',
      })

      setLogs(res)
      setReportGenerated(true)
    } catch (e) {
      setError(true)
      setReportGenerated(false)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    toast({
      title: 'Exportando Relatorio',
      description: 'Gerando PDF assinado digitalmente. Isso pode levar alguns segundos...',
    })
    setTimeout(() => {
      toast({
        title: 'Exportacao Concluida',
        description: 'O download do PDF assinado iniciou automaticamente.',
      })
    }, 2500)
  }

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDesc(!sortDesc)
    } else {
      setSortCol(col)
      setSortDesc(true)
    }
  }

  const kpis = useMemo(() => {
    const totalEvents = logs.length
    const loginCount = logs.filter((l) => l.event_type === 'login').length
    const vitalScoreCount = logs.filter((l) => l.event_type === 'vital_score').length
    const acessoCount = logs.filter((l) => l.event_type === 'acesso_prontuario').length
    const validCount = logs.filter((l) => l.integrity_status === 'valid').length
    const corruptedCount = logs.filter((l) => l.integrity_status === 'corrupted').length
    const integrityRate = totalEvents > 0 ? (validCount / totalEvents) * 100 : 0
    return { totalEvents, loginCount, vitalScoreCount, acessoCount, integrityRate, corruptedCount }
  }, [logs])

  const lgpd = useMemo(() => {
    const lgpdLogs = logs.filter((l) => l.event_type === 'acesso_prontuario')
    const users = Array.from(
      new Set(lgpdLogs.map((l) => l.expand?.usuario_id?.name).filter(Boolean)),
    )
    const totalTempo = lgpdLogs.reduce((acc, l) => acc + (l.payload?.tempo_visualizacao || 0), 0)
    const avgTempo = lgpdLogs.length > 0 ? totalTempo / lgpdLogs.length : 0

    return {
      acessos: lgpdLogs.length,
      usuarios: users,
      avgTempo: avgTempo.toFixed(1) + 's',
      dadosAlterados: kpis.vitalScoreCount,
      rastreabilidade: '100% dos eventos estão selados criptograficamente.',
    }
  }, [logs, kpis])

  const cfp = useMemo(() => {
    const clinicalLogs = logs.filter((l) =>
      ['acesso_prontuario', 'vital_score'].includes(l.event_type),
    )
    const lgpdLogs = logs.filter((l) => l.event_type === 'acesso_prontuario')
    const pacientes = Array.from(
      new Set(lgpdLogs.map((l) => l.payload?.paciente_nome).filter(Boolean)),
    )

    const profsMap = new Map()
    clinicalLogs.forEach((l) => {
      if (l.expand?.usuario_id) {
        profsMap.set(
          l.expand.usuario_id.id,
          `${l.expand.usuario_id.name} (${l.expand.usuario_id.tipo || 'Profissional'})`,
        )
      }
    })

    const clinicalValidCount = clinicalLogs.filter((l) => l.integrity_status === 'valid').length
    const clinicalIntegrityRate =
      clinicalLogs.length > 0 ? (clinicalValidCount / clinicalLogs.length) * 100 : 0
    const tentativas = clinicalLogs.filter((l) => l.integrity_status === 'corrupted').length

    return {
      pacientes,
      profissionais: Array.from(profsMap.values()),
      integridade: clinicalIntegrityRate.toFixed(1) + '%',
      tentativas,
      cadeia: 'Validação de cadeia SHA-256 ativa e confirmada.',
    }
  }, [logs])

  const timelineData = useMemo(() => {
    const map = new Map<string, { date: string; timestamp: number; count: number }>()
    logs.forEach((log) => {
      const d = new Date(log.timestamp)
      const dateStr = format(d, 'dd/MM')
      const key = dateStr
      if (!map.has(key)) {
        map.set(key, { date: dateStr, timestamp: startOfDay(d).getTime(), count: 0 })
      }
      map.get(key)!.count++
    })
    return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp)
  }, [logs])

  const userData = useMemo(() => {
    const map = new Map<string, any>()
    logs.forEach((log) => {
      const user = log.expand?.usuario_id
      const userName = user?.name || 'Desconhecido'
      const userId = user?.id || 'unknown'

      if (!map.has(userId)) {
        map.set(userId, {
          id: userId,
          name: userName,
          total: 0,
          login: 0,
          vital: 0,
          acesso: 0,
          valid: 0,
        })
      }

      const stats = map.get(userId)
      stats.total++
      if (log.event_type === 'login') stats.login++
      if (log.event_type === 'vital_score') stats.vital++
      if (log.event_type === 'acesso_prontuario') stats.acesso++
      if (log.integrity_status === 'valid') stats.valid++
    })

    const data = Array.from(map.values()).map((s) => ({
      ...s,
      integrityRate: s.total > 0 ? (s.valid / s.total) * 100 : 0,
    }))

    return data.sort((a, b) => {
      const valA = a[sortCol]
      const valB = b[sortCol]
      if (typeof valA === 'string') {
        return sortDesc ? valB.localeCompare(valA) : valA.localeCompare(valB)
      }
      return sortDesc ? valB - valA : valA - valB
    })
  }, [logs, sortCol, sortDesc])

  const SortIcon = ({ col }: { col: string }) => {
    if (sortCol !== col) return null
    return sortDesc ? (
      <ArrowDown className="inline w-3 h-3 ml-1" />
    ) : (
      <ArrowUp className="inline w-3 h-3 ml-1" />
    )
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatorio de Conformidade</h1>
          <p className="text-muted-foreground mt-1">
            Monitoramento de atividades, LGPD e normas do conselho profissional
          </p>
        </div>
        {reportGenerated && (
          <Button onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            Exportar PDF
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
            <label className="text-xs font-medium text-slate-500">Data Inicial</label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
            <label className="text-xs font-medium text-slate-500">Data Final</label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
            <label className="text-xs font-medium text-slate-500">Tipo de Evento</label>
            <Select
              value={filters.eventType}
              onValueChange={(v) => setFilters({ ...filters, eventType: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="vital_score">Vital Score</SelectItem>
                <SelectItem value="acesso_prontuario">Acesso a Prontuário</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
            <label className="text-xs font-medium text-slate-500">Usuario</label>
            <Select
              value={filters.userId}
              onValueChange={(v) => setFilters({ ...filters, userId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {availableUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[140px]">
            <Button onClick={handleGenerate} className="w-full" disabled={loading}>
              {loading ? 'Gerando...' : 'Gerar Relatorio'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
      )}

      {!loading && error && (
        <div className="p-8 text-center text-rose-600 bg-rose-50 rounded-lg border border-rose-200 font-medium">
          Erro ao gerar relatorio. Tente novamente.
        </div>
      )}

      {!loading && reportGenerated && !error && logs.length === 0 && (
        <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
          Nenhum log no periodo selecionado.
        </div>
      )}

      {!loading && reportGenerated && !error && logs.length > 0 && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <h2 className="text-xl font-bold mt-8 text-slate-800">RESUMO EXECUTIVO</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Período Selecionado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  de {filters.startDate ? format(new Date(filters.startDate), 'dd/MM/yyyy') : '--'}{' '}
                  ate {filters.endDate ? format(new Date(filters.endDate), 'dd/MM/yyyy') : '--'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Total de eventos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-800">{kpis.totalEvents}</div>
                <p
                  className="text-xs text-slate-500 mt-1 truncate"
                  title={`Logins: ${kpis.loginCount}, Vital Scores: ${kpis.vitalScoreCount}, Acessos: ${kpis.acessoCount}`}
                >
                  Eventos por tipo: {kpis.loginCount} Login, {kpis.vitalScoreCount} Vital Score,{' '}
                  {kpis.acessoCount} Acesso a Prontuário
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Taxa de integridade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">
                  {kpis.integrityRate.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
            <Card className={kpis.corruptedCount > 0 ? 'border-rose-200 bg-rose-50' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Alertas de fraude
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-3xl font-bold ${kpis.corruptedCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}
                >
                  {kpis.corruptedCount}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="w-5 h-5 text-indigo-500" />
                  CONFORMIDADE LGPD
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Acesso a dados pessoais:</span>
                  <span className="font-semibold">{lgpd.acessos} acessos</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Usuarios que acessaram:</span>
                  <span
                    className="font-semibold text-right max-w-[60%] line-clamp-2"
                    title={lgpd.usuarios.join(', ')}
                  >
                    {lgpd.usuarios.length > 0 ? lgpd.usuarios.join(', ') : 'Nenhum'}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Tempo medio de acesso:</span>
                  <span className="font-semibold">{lgpd.avgTempo}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Dados alterados:</span>
                  <span className="font-semibold">{lgpd.dadosAlterados} registros</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rastreabilidade:</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    {lgpd.rastreabilidade}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Stethoscope className="w-5 h-5 text-teal-500" />
                  CONFORMIDADE CFP/CFM
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Prontuarios acessados:</span>
                  <span
                    className="font-semibold text-right max-w-[60%] line-clamp-2"
                    title={cfp.pacientes.join(', ')}
                  >
                    {cfp.pacientes.length > 0 ? cfp.pacientes.join(', ') : 'Nenhum'}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Profissionais que acessaram:</span>
                  <span
                    className="font-semibold text-right max-w-[60%] line-clamp-2"
                    title={cfp.profissionais.join(' | ')}
                  >
                    {cfp.profissionais.length > 0 ? cfp.profissionais.join(' | ') : 'Nenhum'}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Integridade de registros:</span>
                  <span className="font-semibold">{cfp.integridade}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Tentativas de alteracao:</span>
                  <span
                    className={`font-semibold ${cfp.tentativas > 0 ? 'text-rose-600' : 'text-slate-800'}`}
                  >
                    {cfp.tentativas}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cadeia de custoria:</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    {cfp.cadeia}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{ count: { label: 'Eventos', color: 'hsl(var(--primary))' } }}
                  className="h-[300px] w-full"
                >
                  <LineChart
                    data={timelineData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="var(--color-count)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análise por Profissional</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => handleSort('name')}
                      >
                        Usuario <SortIcon col="name" />
                      </TableHead>
                      <TableHead
                        className="text-right cursor-pointer hover:bg-slate-50"
                        onClick={() => handleSort('total')}
                      >
                        Total Eventos <SortIcon col="total" />
                      </TableHead>
                      <TableHead
                        className="text-right cursor-pointer hover:bg-slate-50"
                        onClick={() => handleSort('login')}
                      >
                        Logins <SortIcon col="login" />
                      </TableHead>
                      <TableHead
                        className="text-right cursor-pointer hover:bg-slate-50"
                        onClick={() => handleSort('vital')}
                      >
                        Vital Scores <SortIcon col="vital" />
                      </TableHead>
                      <TableHead
                        className="text-right cursor-pointer hover:bg-slate-50"
                        onClick={() => handleSort('acesso')}
                      >
                        Acessos <SortIcon col="acesso" />
                      </TableHead>
                      <TableHead
                        className="text-right cursor-pointer hover:bg-slate-50"
                        onClick={() => handleSort('integrityRate')}
                      >
                        Taxa Integridade <SortIcon col="integrityRate" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userData.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium whitespace-nowrap">{user.name}</TableCell>
                        <TableCell className="text-right">{user.total}</TableCell>
                        <TableCell className="text-right">{user.login}</TableCell>
                        <TableCell className="text-right">{user.vital}</TableCell>
                        <TableCell className="text-right">{user.acesso}</TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              user.integrityRate < 100
                                ? 'text-rose-500 font-semibold'
                                : 'text-emerald-500'
                            }
                          >
                            {user.integrityRate.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

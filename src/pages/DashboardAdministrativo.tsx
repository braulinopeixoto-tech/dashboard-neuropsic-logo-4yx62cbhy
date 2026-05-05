import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Bar, BarChart, Pie, PieChart, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PieChart as PieChartIcon,
  AlertCircle,
  PlusCircle,
  Inbox,
  RefreshCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const mockRevenueData = [
  { location: 'Salvador', revenue: 15000, fill: 'hsl(var(--chart-1))' },
  { location: 'Seabra', revenue: 8500, fill: 'hsl(var(--chart-2))' },
  { location: 'Irecê', revenue: 6200, fill: 'hsl(var(--chart-3))' },
  { location: 'Consultas Online', revenue: 4300, fill: 'hsl(var(--chart-4))' },
  { location: 'Extras', revenue: 2100, fill: 'hsl(var(--chart-5))' },
]

const mockExpenseData = [
  { category: 'Despesas Fixas', amount: 12500, fill: 'hsl(var(--chart-1))' },
  { category: 'Despesas Voláteis', amount: 8750, fill: 'hsl(var(--chart-2))' },
]

const mockTransactions = [
  {
    id: '1',
    type: 'Receita',
    description: 'Atendimento Online - João S.',
    value: 250,
    date: '25/10/2023',
    category: 'Consultas Online',
  },
  {
    id: '2',
    type: 'Despesa',
    description: 'Aluguel Unidade Salvador',
    value: 3500,
    date: '24/10/2023',
    category: 'Despesas Fixas',
  },
  {
    id: '3',
    type: 'Receita',
    description: 'Pacote 10 Sessões - Maria F.',
    value: 1500,
    date: '23/10/2023',
    category: 'Salvador',
  },
  {
    id: '4',
    type: 'Despesa',
    description: 'Conta de Energia - Seabra',
    value: 450,
    date: '22/10/2023',
    category: 'Despesas Voláteis',
  },
  {
    id: '5',
    type: 'Receita',
    description: 'Avaliação Neuro - Pedro A.',
    value: 800,
    date: '21/10/2023',
    category: 'Irecê',
  },
  {
    id: '6',
    type: 'Receita',
    description: 'Palestra Corporativa',
    value: 2100,
    date: '20/10/2023',
    category: 'Extras',
  },
  {
    id: '7',
    type: 'Despesa',
    description: 'Materiais de Escritório',
    value: 320,
    date: '19/10/2023',
    category: 'Despesas Voláteis',
  },
  {
    id: '8',
    type: 'Receita',
    description: 'Consulta Avulsa - Ana C.',
    value: 300,
    date: '18/10/2023',
    category: 'Seabra',
  },
  {
    id: '9',
    type: 'Despesa',
    description: 'Internet e Telefonia',
    value: 250,
    date: '17/10/2023',
    category: 'Despesas Fixas',
  },
  {
    id: '10',
    type: 'Receita',
    description: 'Supervisão Clínica',
    value: 600,
    date: '16/10/2023',
    category: 'Consultas Online',
  },
]

const revenueChartConfig = {
  revenue: { label: 'Receita' },
}

const expenseChartConfig = {
  amount: { label: 'Valor' },
  'Despesas Fixas': { label: 'Despesas Fixas', color: 'hsl(var(--chart-1))' },
  'Despesas Voláteis': { label: 'Despesas Voláteis', color: 'hsl(var(--chart-2))' },
}

type UIState = 'LOADING' | 'EMPTY' | 'ERROR' | 'SUCCESS'

export default function DashboardAdministrativo() {
  const [uiState, setUiState] = useState<UIState>('LOADING')

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (uiState === 'LOADING') {
      timer = setTimeout(() => setUiState('SUCCESS'), 1000)
    }
    return () => clearTimeout(timer)
  }, [uiState])

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Dashboard Administrativo
        </h1>
        <Select value={uiState} onValueChange={(val: UIState) => setUiState(val)}>
          <SelectTrigger className="w-[120px] h-8 text-xs bg-white text-muted-foreground border-dashed focus:ring-0 focus:ring-offset-0">
            <SelectValue placeholder="Estado UI" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LOADING">Carregando</SelectItem>
            <SelectItem value="SUCCESS">Sucesso</SelectItem>
            <SelectItem value="EMPTY">Vazio</SelectItem>
            <SelectItem value="ERROR">Erro</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Select defaultValue="10">
          <SelectTrigger className="w-[120px] bg-white">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="09">Setembro</SelectItem>
            <SelectItem value="10">Outubro</SelectItem>
            <SelectItem value="11">Novembro</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="2023">
          <SelectTrigger className="w-[100px] bg-white">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2022">2022</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  if (uiState === 'LOADING') {
    return (
      <div>
        {renderHeader()}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl bg-slate-200/50" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Skeleton className="h-[350px] rounded-xl bg-slate-200/50" />
          <Skeleton className="h-[350px] rounded-xl bg-slate-200/50" />
        </div>
        <Skeleton className="h-[400px] rounded-xl bg-slate-200/50" />
      </div>
    )
  }

  if (uiState === 'ERROR') {
    return (
      <div>
        {renderHeader()}
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-4 animate-fade-in bg-white rounded-xl border border-slate-200 shadow-sm">
          <AlertCircle className="h-16 w-16 text-rose-500" />
          <h2 className="text-2xl font-semibold text-slate-800">
            Erro ao carregar dados. Tente novamente.
          </h2>
          <Button onClick={() => setUiState('LOADING')} variant="outline" className="mt-4">
            <RefreshCcw className="mr-2 h-4 w-4" /> Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  if (uiState === 'EMPTY') {
    return (
      <div>
        {renderHeader()}
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-4 animate-fade-in bg-white rounded-xl border border-slate-200 shadow-sm">
          <Inbox className="h-16 w-16 text-slate-300" />
          <h2 className="text-2xl font-semibold text-slate-600">Nenhuma transação registrada</h2>
          <p className="text-slate-500 mb-4">
            Ainda não há dados financeiros para o período selecionado.
          </p>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar receita
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {renderHeader()}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-fade-in-up">
        {[
          {
            title: 'Receita Total',
            value: 36100,
            icon: ArrowUpRight,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50',
            valColor: 'text-emerald-600',
            isCurrency: true,
          },
          {
            title: 'Despesas Totais',
            value: 21250,
            icon: ArrowDownRight,
            color: 'text-rose-500',
            bg: 'bg-rose-50',
            valColor: 'text-rose-600',
            isCurrency: true,
          },
          {
            title: 'Saldo Líquido',
            value: 14850,
            icon: Wallet,
            color: 'text-blue-500',
            bg: 'bg-blue-50',
            valColor: 'text-blue-600',
            isCurrency: true,
          },
          {
            title: 'Margem %',
            value: 41.1,
            icon: PieChartIcon,
            color: 'text-purple-500',
            bg: 'bg-purple-50',
            valColor: 'text-purple-600',
            isCurrency: false,
            suffix: '%',
          },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-subtle hover:shadow-elevation transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">{stat.title}</CardTitle>
              <div className={`p-2 ${stat.bg} rounded-full`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.valColor}`}>
                {stat.isCurrency ? formatCurrency(stat.value) : `${stat.value}${stat.suffix}`}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 animate-fade-in-up"
        style={{ animationDelay: '100ms' }}
      >
        <Card className="border-none shadow-subtle">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800">Receita por Unidade</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueChartConfig} className="h-[280px] w-full">
              <BarChart
                data={mockRevenueData}
                layout="vertical"
                margin={{ left: 10, right: 10, top: 0, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="location"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  width={120}
                />
                <ChartTooltip
                  cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  content={<ChartTooltipContent formatter={(val) => formatCurrency(Number(val))} />}
                />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-subtle">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800">Despesas Fixas vs. Voláteis</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={expenseChartConfig} className="h-[280px] w-full">
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(val) => formatCurrency(Number(val))} />}
                />
                <Pie
                  data={mockExpenseData}
                  dataKey="amount"
                  nameKey="category"
                  innerRadius={60}
                  strokeWidth={2}
                  paddingAngle={2}
                />
                <ChartLegend content={<ChartLegendContent />} className="mt-4" />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card
        className="border-none shadow-subtle animate-fade-in-up"
        style={{ animationDelay: '200ms' }}
      >
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                          tx.type === 'Receita'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700',
                        )}
                      >
                        {tx.type}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-slate-700">{tx.description}</TableCell>
                    <TableCell className="text-slate-500">{tx.category}</TableCell>
                    <TableCell className="text-slate-500">{tx.date}</TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-bold',
                        tx.type === 'Receita' ? 'text-emerald-600' : 'text-rose-600',
                      )}
                    >
                      {tx.type === 'Receita' ? '+' : '-'}
                      {formatCurrency(tx.value)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

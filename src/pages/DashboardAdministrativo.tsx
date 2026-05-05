import { useState, useEffect } from 'react'
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
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getReceitas, getDespesas, getCategoriasDespesas } from '@/services/financeiro'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ReceitaForm } from '@/components/financeiro/ReceitaForm'
import { DespesaForm } from '@/components/financeiro/DespesaForm'

type UIState = 'LOADING' | 'EMPTY' | 'ERROR' | 'SUCCESS'

const revenueChartConfig = {
  revenue: { label: 'Receita' },
}

const expenseChartConfig = {
  amount: { label: 'Valor' },
  'Despesas Fixas': { label: 'Despesas Fixas', color: 'hsl(var(--chart-1))' },
  'Despesas Voláteis': { label: 'Despesas Voláteis', color: 'hsl(var(--chart-2))' },
}

export default function DashboardAdministrativo() {
  const { user } = useAuth()
  const [uiState, setUiState] = useState<UIState>('LOADING')
  const [receitas, setReceitas] = useState<any[]>([])
  const [despesas, setDespesas] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [receitaOpen, setReceitaOpen] = useState(false)
  const [despesaOpen, setDespesaOpen] = useState(false)

  const loadData = async () => {
    if (!user) return
    try {
      const [rec, des, cat] = await Promise.all([
        getReceitas(),
        getDespesas(),
        getCategoriasDespesas(),
      ])
      setReceitas(rec)
      setDespesas(des)
      setCategorias(cat)
      setUiState(rec.length || des.length ? 'SUCCESS' : 'EMPTY')
    } catch (e) {
      setUiState('ERROR')
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  useRealtime(
    'receitas',
    () => {
      if (user) loadData()
    },
    !!user,
  )
  useRealtime(
    'despesas',
    () => {
      if (user) loadData()
    },
    !!user,
  )

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const receitaTotal = receitas.reduce((a, r) => a + r.valor, 0)
  const despesaTotal = despesas.reduce((a, d) => a + d.valor, 0)
  const saldoLiquido = receitaTotal - despesaTotal
  const margem = receitaTotal > 0 ? (saldoLiquido / receitaTotal) * 100 : 0

  const revByLocal = receitas.reduce(
    (acc, r) => {
      acc[r.local] = (acc[r.local] || 0) + r.valor
      return acc
    },
    {} as Record<string, number>,
  )

  const revenueData = Object.entries(revByLocal).map(([local, revenue], i) => ({
    local,
    revenue,
    fill: `hsl(var(--chart-${(i % 5) + 1}))`,
  }))

  const expByTipo = despesas.reduce(
    (acc, d) => {
      acc[d.tipo] = (acc[d.tipo] || 0) + d.valor
      return acc
    },
    {} as Record<string, number>,
  )

  const expenseData = [
    { category: 'Despesas Fixas', amount: expByTipo['Fixo'] || 0, fill: 'hsl(var(--chart-1))' },
    {
      category: 'Despesas Voláteis',
      amount: expByTipo['Variável'] || 0,
      fill: 'hsl(var(--chart-2))',
    },
  ].filter((d) => d.amount > 0)

  const allTransactions = [
    ...receitas.map((r) => ({
      id: r.id,
      type: 'Receita',
      description: r.descricao,
      value: r.valor,
      date: new Date(r.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
      category: r.local,
      rawDate: new Date(r.data).getTime(),
    })),
    ...despesas.map((d) => ({
      id: d.id,
      type: 'Despesa',
      description: d.descricao,
      value: d.valor,
      date: new Date(d.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
      category: d.categoria,
      rawDate: new Date(d.data).getTime(),
    })),
  ]
    .sort((a, b) => b.rawDate - a.rawDate)
    .slice(0, 10)

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Financeiro</h1>
      <div className="flex items-center gap-2">
        <Dialog open={receitaOpen} onOpenChange={setReceitaOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Receita
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Receita</DialogTitle>
            </DialogHeader>
            <ReceitaForm onSuccess={() => setReceitaOpen(false)} />
          </DialogContent>
        </Dialog>
        <Dialog open={despesaOpen} onOpenChange={setDespesaOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50">
              <PlusCircle className="mr-2 h-4 w-4" /> Despesa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Despesa</DialogTitle>
            </DialogHeader>
            <DespesaForm categorias={categorias} onSuccess={() => setDespesaOpen(false)} />
          </DialogContent>
        </Dialog>
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
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-4 bg-white rounded-xl border shadow-sm">
          <AlertCircle className="h-16 w-16 text-rose-500" />
          <h2 className="text-2xl font-semibold text-slate-800">Erro ao carregar dados.</h2>
          <Button onClick={loadData} variant="outline">
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
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-4 bg-white rounded-xl border shadow-sm">
          <Inbox className="h-16 w-16 text-slate-300" />
          <h2 className="text-2xl font-semibold text-slate-600">Nenhuma transação registrada</h2>
          <p className="text-slate-500 mb-4">Adicione uma receita ou despesa para começar.</p>
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
            value: receitaTotal,
            icon: ArrowUpRight,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50',
            valColor: 'text-emerald-600',
            isCurrency: true,
          },
          {
            title: 'Despesas Totais',
            value: despesaTotal,
            icon: ArrowDownRight,
            color: 'text-rose-500',
            bg: 'bg-rose-50',
            valColor: 'text-rose-600',
            isCurrency: true,
          },
          {
            title: 'Saldo Líquido',
            value: saldoLiquido,
            icon: Wallet,
            color: 'text-blue-500',
            bg: 'bg-blue-50',
            valColor: 'text-blue-600',
            isCurrency: true,
          },
          {
            title: 'Margem %',
            value: margem.toFixed(1),
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
                {stat.isCurrency
                  ? formatCurrency(stat.value as number)
                  : `${stat.value}${stat.suffix}`}
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
            {revenueData.length > 0 ? (
              <ChartContainer config={revenueChartConfig} className="h-[280px] w-full">
                <BarChart
                  data={revenueData}
                  layout="vertical"
                  margin={{ left: 10, right: 10, top: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="local"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    width={120}
                  />
                  <ChartTooltip
                    cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                    content={
                      <ChartTooltipContent formatter={(val) => formatCurrency(Number(val))} />
                    }
                  />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-slate-400">
                Sem dados de receita
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-subtle">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800">Despesas Fixas vs. Voláteis</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseData.length > 0 ? (
              <ChartContainer config={expenseChartConfig} className="h-[280px] w-full">
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent formatter={(val) => formatCurrency(Number(val))} />
                    }
                  />
                  <Pie
                    data={expenseData}
                    dataKey="amount"
                    nameKey="category"
                    innerRadius={60}
                    strokeWidth={2}
                    paddingAngle={2}
                  />
                  <ChartLegend content={<ChartLegendContent />} className="mt-4" />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-slate-400">
                Sem dados de despesa
              </div>
            )}
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
                  <TableHead>Categoria/Local</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allTransactions.map((tx) => (
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

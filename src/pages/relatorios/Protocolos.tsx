import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export function RelatoriosProtocolos({ data }: any) {
  const protocolsTableData = useMemo(() => {
    const grouped = data.protocolos.reduce((acc: any, prot: any) => {
      if (!acc[prot.tipo]) {
        acc[prot.tipo] = { tipo: prot.tipo, count: 0, totalProgresso: 0, protocolos: [] }
      }
      acc[prot.tipo].count += 1
      acc[prot.tipo].totalProgresso +=
        prot.total_sessoes > 0 ? (prot.sessoes_concluidas / prot.total_sessoes) * 100 : 0
      acc[prot.tipo].protocolos.push(prot)
      return acc
    }, {})

    return Object.values(grouped).map((g: any) => {
      const sessoesTipo = data.sessoes.filter((s: any) =>
        g.protocolos.some((p: any) => p.id === s.protocolo_id),
      )
      const faltas = sessoesTipo.filter((s: any) => s.status === 'faltou').length

      let sumDays = 0
      let countConcluidos = 0
      g.protocolos.forEach((p: any) => {
        if (p.data_inicio && p.data_prevista_fim) {
          const start = new Date(p.data_inicio)
          const end = new Date(p.data_prevista_fim)
          sumDays += (end.getTime() - start.getTime()) / (1000 * 3600 * 24)
          countConcluidos++
        }
      })
      const tempoMedio =
        countConcluidos > 0 ? `${Math.round(sumDays / countConcluidos)} dias` : 'N/A'

      return {
        tipo: g.tipo,
        pacientes: g.count,
        taxaConclusao: g.count > 0 ? g.totalProgresso / g.count : 0,
        tempoMedio,
        faltas,
      }
    })
  }, [data])

  if (protocolsTableData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200">
        <p className="text-slate-500 font-medium">
          Nenhum protocolo encontrado para os filtros ativos.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/80 border-b border-slate-200">
            <TableRow>
              <TableHead className="font-semibold text-slate-700">Tipo de Protocolo</TableHead>
              <TableHead className="font-semibold text-slate-700">Total de Pacientes</TableHead>
              <TableHead className="font-semibold text-slate-700">
                Taxa de Conclusão Média
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Tempo Médio de Conclusão
              </TableHead>
              <TableHead className="font-semibold text-slate-700 text-right">
                Faltas Totais
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {protocolsTableData.map((p: any) => (
              <TableRow key={p.tipo} className="hover:bg-slate-50/50">
                <TableCell className="font-medium">
                  <Badge className="bg-slate-800 hover:bg-slate-700">{p.tipo}</Badge>
                </TableCell>
                <TableCell className="text-slate-700">{p.pacientes}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700">
                      {p.taxaConclusao.toFixed(1)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-slate-600">{p.tempoMedio}</TableCell>
                <TableCell className="text-right font-medium text-amber-600">{p.faltas}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 gap-4 md:hidden">
        {protocolsTableData.map((p: any) => (
          <Card key={p.tipo} className="shadow-sm border-slate-200">
            <CardContent className="p-4 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <Badge className="bg-slate-800 text-sm px-3 py-1">{p.tipo}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                <div>
                  <span className="text-slate-400 block text-xs uppercase font-medium mb-1">
                    Pacientes
                  </span>
                  <span className="font-medium text-slate-900">{p.pacientes}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs uppercase font-medium mb-1">
                    Taxa Conclusão
                  </span>
                  <span className="font-medium text-slate-900">{p.taxaConclusao.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs uppercase font-medium mb-1">
                    Tempo Médio
                  </span>
                  <span className="font-medium text-slate-900">{p.tempoMedio}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs uppercase font-medium mb-1">
                    Faltas Totais
                  </span>
                  <span className="font-medium text-amber-600">{p.faltas}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

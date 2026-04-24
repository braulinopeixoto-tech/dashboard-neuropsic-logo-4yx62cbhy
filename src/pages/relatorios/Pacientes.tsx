import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { Download, ArrowUpDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function RelatoriosPacientes({ data, rawData }: any) {
  const [sortConfig, setSortConfig] = useState({ key: 'nome', direction: 'asc' })

  const patientsTableData = useMemo(() => {
    const list = data.protocolos.map((prot: any) => {
      const pac = rawData.pacientes.find((p: any) => p.id === prot.paciente_id)
      const sessoesDoProtocolo = data.sessoes.filter((s: any) => s.protocolo_id === prot.id)
      const faltas = sessoesDoProtocolo.filter((s: any) => s.status === 'faltou').length
      const sessoesRealizadas = sessoesDoProtocolo.filter((s: any) => s.status === 'realizada')

      let ultimaSessao = '-'
      if (sessoesRealizadas.length > 0) {
        const dates = sessoesRealizadas.map((s: any) =>
          new Date(s.data_realizada || s.created).getTime(),
        )
        ultimaSessao = format(new Date(Math.max(...dates)), 'dd/MM/yyyy')
      }

      return {
        id: prot.id,
        nome: pac?.nome || 'Paciente Desconhecido',
        protocolo: prot.tipo,
        progresso:
          prot.total_sessoes > 0 ? (prot.sessoes_concluidas / prot.total_sessoes) * 100 : 0,
        faltas,
        status: prot.status,
        ultimaSessao,
      }
    })

    list.sort((a: any, b: any) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    return list
  }, [data, rawData, sortConfig])

  const requestSort = (key: string) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'
    setSortConfig({ key, direction })
  }

  const handleExportCSV = () => {
    const headers = ['Nome', 'Protocolo', 'Progresso (%)', 'Faltas', 'Status', 'Última Sessão']
    const rows = patientsTableData.map((p: any) => [
      `"${p.nome}"`,
      p.protocolo,
      p.progresso.toFixed(1),
      p.faltas,
      p.status,
      p.ultimaSessao,
    ])
    const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `relatorio_pacientes_${format(new Date(), 'yyyyMMdd')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const SortHead = ({ label, sortKey }: any) => (
    <TableHead
      className="cursor-pointer hover:bg-slate-100 transition-colors"
      onClick={() => requestSort(sortKey)}
    >
      <div className="flex items-center gap-2 font-semibold">
        {label} <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
      </div>
    </TableHead>
  )

  if (patientsTableData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200">
        <p className="text-slate-500 font-medium">
          Nenhum paciente encontrado para os filtros ativos.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex justify-end">
        <Button
          onClick={handleExportCSV}
          variant="outline"
          size="sm"
          className="bg-white hover:bg-slate-50 text-primary"
        >
          <Download className="h-4 w-4 mr-2" /> Exportar para CSV
        </Button>
      </div>

      <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/80 border-b border-slate-200">
            <TableRow>
              <SortHead label="Nome do Paciente" sortKey="nome" />
              <SortHead label="Protocolo" sortKey="protocolo" />
              <SortHead label="Progresso" sortKey="progresso" />
              <SortHead label="Faltas" sortKey="faltas" />
              <SortHead label="Status" sortKey="status" />
              <SortHead label="Última Sessão" sortKey="ultimaSessao" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {patientsTableData.map((p: any) => (
              <TableRow key={p.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell className="font-medium text-slate-900">{p.nome}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {p.protocolo}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${p.progresso}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-600 w-8">
                      {p.progresso.toFixed(0)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={p.faltas > 0 ? 'text-amber-600 font-medium' : 'text-slate-500'}>
                    {p.faltas}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      p.status === 'ativo'
                        ? 'default'
                        : p.status === 'concluído'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-500 text-sm">{p.ultimaSessao}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 gap-4 md:hidden">
        {patientsTableData.map((p: any) => (
          <Card key={p.id} className="shadow-sm border-slate-200">
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h4 className="font-semibold text-slate-900">{p.nome}</h4>
                  <div className="mt-1 flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {p.protocolo}
                    </Badge>
                    <Badge
                      variant={
                        p.status === 'ativo'
                          ? 'default'
                          : p.status === 'concluído'
                            ? 'secondary'
                            : 'outline'
                      }
                      className="text-xs"
                    >
                      {p.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 bg-slate-50 p-3 rounded-lg text-sm border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-xs uppercase font-medium mb-1">
                    Progresso
                  </span>
                  <span className="font-medium">{p.progresso.toFixed(0)}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs uppercase font-medium mb-1">
                    Faltas
                  </span>
                  <span className={p.faltas > 0 ? 'text-amber-600 font-medium' : 'font-medium'}>
                    {p.faltas}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-xs uppercase font-medium mb-1">
                    Última Sessão
                  </span>
                  <span className="font-medium">{p.ultimaSessao}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

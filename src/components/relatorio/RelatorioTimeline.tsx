import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Activity, AlertTriangle, FileEdit } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function RelatorioTimeline({ data }: { data: any }) {
  const events = useMemo(() => {
    const list: any[] = []

    data.sessoes.forEach((s: any) => {
      list.push({
        id: s.id,
        date: new Date(s.data_realizada || s.data_agendada),
        type: s.status === 'faltou' ? 'falta' : 'sessao',
        title: `Sessão ${s.numero_sessao} - ${s.status}`,
        desc: s.observacoes || 'Sem observações adicionais.',
        icon: s.status === 'faltou' ? AlertTriangle : Calendar,
        color: s.status === 'faltou' ? 'text-red-500 bg-red-100' : 'text-blue-500 bg-blue-100',
      })
    })

    data.intervencoes.forEach((i: any) => {
      list.push({
        id: i.id,
        date: new Date(i.data_intervencao),
        type: 'intervencao',
        title: `Intervenção: ${i.tipo}`,
        desc: i.descricao,
        icon: Activity,
        color: 'text-purple-500 bg-purple-100',
      })
    })

    data.auditLogs.forEach((a: any) => {
      list.push({
        id: a.id,
        date: new Date(a.timestamp),
        type: 'auditoria',
        title: `Alteração de Protocolo (${a.action})`,
        desc: a.change_summary,
        icon: FileEdit,
        color: 'text-amber-500 bg-amber-100',
      })
    })

    return list.sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [data])

  if (events.length === 0) {
    return (
      <div className="text-slate-500 text-center py-4">Nenhum evento registrado no histórico.</div>
    )
  }

  return (
    <Card className="print:shadow-none print:border-slate-300 print:break-inside-avoid">
      <CardHeader>
        <CardTitle className="text-lg">Histórico Cronológico e Auditável</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
          {events.map((ev, idx) => (
            <div
              key={ev.id + idx}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${ev.color} print:border-slate-200 z-10`}
              >
                <ev.icon className="w-4 h-4" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 bg-white shadow-sm print:shadow-none">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="capitalize print:border-slate-300">
                    {ev.type}
                  </Badge>
                  <time className="text-xs font-medium text-slate-500">
                    {ev.date.toLocaleDateString('pt-BR')}
                  </time>
                </div>
                <div className="font-bold text-slate-800 mb-1">{ev.title}</div>
                <div className="text-sm text-slate-600 line-clamp-3 hover:line-clamp-none transition-all">
                  {ev.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

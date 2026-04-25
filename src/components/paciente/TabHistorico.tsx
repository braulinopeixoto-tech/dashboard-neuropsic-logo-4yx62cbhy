import { CheckCircle2, XCircle, RefreshCw, CalendarIcon, FileText } from 'lucide-react'
import { format } from 'date-fns'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'realizada':
      return <CheckCircle2 className="w-5 h-5 text-success bg-white rounded-full" />
    case 'faltou':
      return <XCircle className="w-5 h-5 text-error bg-white rounded-full" />
    case 'remarcada':
      return <RefreshCw className="w-5 h-5 text-alert bg-white rounded-full" />
    case 'agendada':
      return <CalendarIcon className="w-5 h-5 text-primary bg-white rounded-full" />
    default:
      return <CalendarIcon className="w-5 h-5 text-slate-500 bg-white rounded-full" />
  }
}

export function TabHistorico({ sessoes }: { sessoes: any[] }) {
  if (!sessoes || sessoes.length === 0) {
    return (
      <div className="p-5 text-center text-slate-500 bg-white rounded-xl border border-border font-normal text-sm">
        Nenhum histórico
      </div>
    )
  }

  const sorted = [...sessoes].sort((a, b) => {
    const da = new Date(a.data_realizada || a.data_agendada || a.created).getTime()
    const db = new Date(b.data_realizada || b.data_agendada || b.created).getTime()
    return db - da
  })

  return (
    <div className="bg-white rounded-xl border border-border p-5 shadow-subtle hover:shadow-elevation transition-all duration-200">
      <h3 className="text-base font-semibold text-slate-900 mb-6">Linha do Tempo de Sessões</h3>
      <div className="relative border-l-2 border-border ml-4 space-y-4 pb-2">
        {sorted.map((sessao, index) => {
          const dateStr = sessao.data_realizada || sessao.data_agendada || sessao.created
          const date = dateStr ? format(new Date(dateStr), 'dd/MM/yyyy') : ''
          const time = dateStr ? format(new Date(dateStr), 'HH:mm') : ''

          let titleText = `Sessão ${sessao.numero_sessao} ${sessao.status}`
          if (sessao.status === 'faltou') titleText = `Sessão ${sessao.numero_sessao} faltou`

          return (
            <div
              key={sessao.id}
              className="relative pl-6 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="absolute -left-[0.8rem] top-1">{getStatusIcon(sessao.status)}</div>
              <div className="bg-slate-50 border border-border rounded-lg p-0 overflow-hidden hover:shadow-subtle transition-all duration-200">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1" className="border-none">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-100/50">
                      <div className="flex flex-col items-start gap-1 text-left">
                        <span className="font-semibold text-base text-slate-900">
                          {titleText}{' '}
                          <span className="font-normal text-sm text-slate-500">
                            — {date}
                            {time ? `, ${time}` : ''}
                          </span>
                        </span>
                      </div>
                    </AccordionTrigger>
                    {sessao.observacoes && (
                      <AccordionContent className="px-4 pb-4 text-slate-600 text-sm">
                        <div className="flex gap-2 items-start bg-white p-3 rounded border border-slate-100">
                          <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                          <p className="whitespace-pre-wrap">{sessao.observacoes}</p>
                        </div>
                      </AccordionContent>
                    )}
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

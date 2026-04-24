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
      return <CheckCircle2 className="w-5 h-5 text-emerald-500 bg-white rounded-full" />
    case 'faltou':
      return <XCircle className="w-5 h-5 text-rose-500 bg-white rounded-full" />
    case 'remarcada':
      return <RefreshCw className="w-5 h-5 text-amber-500 bg-white rounded-full" />
    case 'agendada':
      return <CalendarIcon className="w-5 h-5 text-blue-500 bg-white rounded-full" />
    default:
      return <CalendarIcon className="w-5 h-5 text-slate-500 bg-white rounded-full" />
  }
}

export function TabHistorico({ sessoes }: { sessoes: any[] }) {
  if (!sessoes || sessoes.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        Nenhum histórico disponível.
      </div>
    )
  }

  const sorted = [...sessoes].sort((a, b) => {
    const da = new Date(a.data_realizada || a.data_agendada || a.created).getTime()
    const db = new Date(b.data_realizada || b.data_agendada || b.created).getTime()
    return db - da
  })

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">Linha do Tempo de Sessões</h3>
      <div className="relative border-l-2 border-slate-100 ml-4 space-y-6 pb-2">
        {sorted.map((sessao) => {
          const dateStr = sessao.data_realizada || sessao.data_agendada || sessao.created
          const date = dateStr ? format(new Date(dateStr), "dd 'de' MMM, yyyy 'às' HH:mm") : ''
          return (
            <div key={sessao.id} className="relative pl-6">
              <div className="absolute -left-[0.8rem] top-1">{getStatusIcon(sessao.status)}</div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-0 overflow-hidden">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1" className="border-none">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-100/50">
                      <div className="flex flex-col items-start gap-1 text-left">
                        <span className="font-medium text-slate-900">
                          Sessão {sessao.numero_sessao}{' '}
                          <span className="text-slate-500 font-normal ml-2 capitalize">
                            ({sessao.status})
                          </span>
                        </span>
                        <span className="text-xs text-slate-500">{date}</span>
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

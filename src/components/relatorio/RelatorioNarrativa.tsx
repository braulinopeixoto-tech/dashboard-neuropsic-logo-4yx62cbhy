import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Database, BrainCircuit, GitPullRequest, ArrowRightCircle } from 'lucide-react'

export function RelatorioNarrativa({ data }: { data: any }) {
  const latestRisk = data.riskScores[0]
  const latestIntervencao = data.intervencoes[0]
  const faltas = data.sessoes.filter((s: any) => s.status === 'faltou')

  let dado = 'Paciente iniciou o tratamento com engajamento padrão.'
  let interpretacao = 'Adesão inicial ao protocolo estabelecido de forma satisfatória.'
  let decisao = 'Manter o acompanhamento regular e evoluções programadas.'
  let interv = 'Monitoramento padrão em sessões subsequentes.'

  if (latestRisk?.alert_level === 'alto' || latestRisk?.alert_level === 'crítico') {
    dado = latestRisk.alert_message || 'Score de risco clinicamente elevado detectado.'
    interpretacao = `Risco ${latestRisk.alert_level} de abandono ou estagnação terapêutica.`
    decisao = 'Acionamento imediato de protocolo de resgate clínico.'
    interv = latestIntervencao
      ? `Realizada intervenção preventiva: ${latestIntervencao.tipo}`
      : 'Aguardando intervenção ativa do profissional.'
  } else if (faltas.length >= 2) {
    dado = `Identificadas ${faltas.length} faltas no histórico recente do paciente.`
    interpretacao = 'Forte indicativo de quebra de engajamento ou obstáculo externo.'
    decisao = 'Investigar ativamente os motivos da ausência e reavaliar plano.'
    interv = latestIntervencao
      ? `Contato de acompanhamento realizado: ${latestIntervencao.tipo}`
      : 'Recomendado contato ativo para resgate de vínculo.'
  } else if (
    data.dndas.length > 0 &&
    data.dndas[data.dndas.length - 1].classification === 'instável'
  ) {
    dado = "Última avaliação DNDA™ classificou estado neurofuncional como 'instável'."
    interpretacao = 'Flutuações significativas nos domínios funcionais ou neurobiológicos.'
    decisao = 'Ajustar foco da intervenção para estabilização de base.'
    interv = latestIntervencao
      ? `Adaptação de abordagem: ${latestIntervencao.tipo}`
      : 'Planejada reavaliação de protocolo neuromodulatório.'
  }

  const steps = [
    {
      title: 'Dado Clínico (Evidência)',
      desc: dado,
      icon: Database,
      color: 'text-blue-500 bg-blue-100',
    },
    {
      title: 'Interpretação (Análise)',
      desc: interpretacao,
      icon: BrainCircuit,
      color: 'text-purple-500 bg-purple-100',
    },
    {
      title: 'Decisão (Raciocínio)',
      desc: decisao,
      icon: GitPullRequest,
      color: 'text-amber-500 bg-amber-100',
    },
    {
      title: 'Intervenção (Ação)',
      desc: interv,
      icon: ArrowRightCircle,
      color: 'text-green-500 bg-green-100',
    },
  ]

  return (
    <Card className="print:shadow-none print:border-slate-300 print:break-inside-avoid">
      <CardHeader>
        <CardTitle className="text-lg">Encadeamento Lógico Narrativo</CardTitle>
        <p className="text-sm text-slate-500">
          Justificativa clínica estruturada baseada em dados reais e auditáveis do sistema.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-0">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-4 group">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm ${step.color}`}
                >
                  <step.icon className="w-5 h-5" />
                </div>
                {idx < steps.length - 1 && (
                  <div className="w-0.5 h-12 bg-slate-200 my-1 group-hover:bg-slate-300 transition-colors print:bg-slate-300"></div>
                )}
              </div>
              <div className="pt-2 pb-6">
                <h4 className="font-bold text-slate-800 text-sm md:text-base">{step.title}</h4>
                <p className="text-sm text-slate-600 mt-1">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

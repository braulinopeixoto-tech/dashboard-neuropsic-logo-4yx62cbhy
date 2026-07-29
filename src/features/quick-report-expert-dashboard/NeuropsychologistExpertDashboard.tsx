import {
  BrainCircuit,
  Database,
  FileCheck2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import QuickReport from '@/pages/QuickReport'

const capabilities = [
  {
    icon: FileCheck2,
    label: 'Pipeline',
    value: 'NQL Advanced',
    detail: 'Parser bruto, síntese neurofuncional e perfis documentais.',
  },
  {
    icon: ShieldCheck,
    label: 'AI Trust',
    value: 'AuditTrace + Safety Guard',
    detail: 'Hash, limitações, evidências usadas e linguagem clínica controlada.',
  },
  {
    icon: Database,
    label: 'Persistência',
    value: 'PocketBase atual',
    detail: 'A gravação permanece no fluxo existente e exige revisão humana.',
  },
  {
    icon: BrainCircuit,
    label: 'Runtime real',
    value: 'Determinístico local',
    detail: 'Não representa LLM live nem retrieval vetorial real.',
  },
] as const

export default function NeuropsychologistExpertDashboard() {
  return (
    <div className="space-y-6" data-testid="neuropsychologist-expert-dashboard">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 px-6 py-7 text-white shadow-2xl shadow-slate-950/10 md:px-9">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-0 bg-cyan-300 text-slate-950 hover:bg-cyan-300">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                EXPERT REVIEW CANDIDATE
              </Badge>
              <Badge
                variant="outline"
                className="border-amber-300/40 bg-amber-300/10 text-amber-100"
              >
                REVISÃO HUMANA OBRIGATÓRIA
              </Badge>
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-[0.28em] text-cyan-200">
              Dashboard Neuropsicólogo
            </p>
            <h1 className="mt-2 max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
              Quick Report clínico com AI Trust verificável
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
              O pipeline pode estruturar evidências e propor sínteses prudentes. A
              responsabilidade, aprovação e persistência do documento continuam sob
              controle explícito do profissional.
            </p>
          </div>

          <div className="grid min-w-[280px] gap-2 text-sm">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <LockKeyhole className="h-4 w-4 text-cyan-300" />
              <span>Sem deploy ou alteração de produção</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <UserCheck className="h-4 w-4 text-emerald-300" />
              <span>Salvar somente após aprovação humana</span>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-label="Estado verificável do Quick Report"
        className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
      >
        {capabilities.map(({ icon: Icon, label, value, detail }) => (
          <Card key={label} className="border-slate-200/80 bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  {label}
                </p>
                <span className="rounded-xl bg-slate-100 p-2 text-slate-700">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-4 font-bold text-slate-950">{value}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="rounded-[2rem] border border-slate-200 bg-slate-50/70 p-2 shadow-sm md:p-3">
        <QuickReport />
      </div>
    </div>
  )
}

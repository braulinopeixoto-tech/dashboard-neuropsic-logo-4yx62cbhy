import { useEffect, useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useForm, FormProvider, useWatch } from 'react-hook-form'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { getPaciente } from '@/services/pacientes'
import { createDnda, getDnda } from '@/services/dnda'
import pb from '@/lib/pocketbase/client'
import { ArrowLeft, Save, Code, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

import { Tabs1To3 } from '@/components/dnda/Tabs1To3'
import { Tabs4To6 } from '@/components/dnda/Tabs4To6'
import { Tabs7To9 } from '@/components/dnda/Tabs7To9'

const REQUIRED_FIELDS = [
  'neuroenergetica_potencia',
  'neuroenergetica_tbr',
  'neuroenergetica_excitacao',
  'neuroenergetica_variabilidade',
  'integracao_coerencia',
  'integracao_conectividade',
  'integracao_dmn',
  'integracao_salience',
  'integracao_executive',
  'organizacional_simetria',
  'organizacional_gradientes',
  'organizacional_topografia',
  'organizacional_complexidade',
  'funcional_atencao_sustentada',
  'funcional_atencao_seletiva',
  'funcional_controle_inibitorio',
  'funcional_flexibilidade',
  'funcional_memoria_trabalho',
  'funcional_processamento_emocional',
  'funcional_big_five',
  'rdoc_valencia_negativa',
  'rdoc_valencia_positiva',
  'rdoc_arousal_regulacao',
  'rdoc_sistemas_cognitivos',
  'rdoc_sistemas_sociais',
  'rdoc_regulacao_sensoriomotora',
  'neurobiologica_metabolismo',
  'neurobiologica_inflamacao',
  'neurobiologica_sono',
  'neurobiologica_hrv',
  'neurobiologica_ciclo_menstrual',
  'neurobiologica_dieta',
  'neurobiologica_intestino',
  'temporal_traumas',
  'temporal_perdas',
  'temporal_classificacao_perdas',
  'temporal_evolucao',
  'temporal_resposta_intervencoes',
  'convergencia_risco_clinico',
  'convergencia_estado_neurofuncional',
  'convergencia_vetor_adaptativo',
  'convergencia_resumo',
]

const NUMERIC_FIELDS = [
  'neuroenergetica_potencia',
  'neuroenergetica_tbr',
  'neuroenergetica_excitacao',
  'integracao_coerencia',
  'integracao_conectividade',
  'organizacional_simetria',
  'organizacional_gradientes',
  'organizacional_topografia',
  'organizacional_complexidade',
  'funcional_atencao_sustentada',
  'funcional_atencao_seletiva',
  'funcional_controle_inibitorio',
  'funcional_flexibilidade',
  'funcional_memoria_trabalho',
  'funcional_processamento_emocional',
  'rdoc_valencia_negativa',
  'rdoc_valencia_positiva',
  'rdoc_sistemas_cognitivos',
  'rdoc_sistemas_sociais',
  'rdoc_regulacao_sensoriomotora',
  'rdoc_arousal_regulacao',
  'neurobiologica_metabolismo',
  'neurobiologica_inflamacao',
  'neurobiologica_sono',
  'neurobiologica_hrv',
]

const FIELD_NAMES_MAP: Record<string, string> = {
  neuroenergetica_potencia: 'Potência Absoluta',
  neuroenergetica_tbr: 'Theta/Beta Ratio',
  neuroenergetica_excitacao: 'Nível de Excitação Global',
  neuroenergetica_variabilidade: 'Variabilidade',
  integracao_coerencia: 'Coerência Global',
  integracao_conectividade: 'Conectividade Funcional',
  integracao_dmn: 'DMN',
  integracao_salience: 'Rede de Saliência',
  integracao_executive: 'Rede Executiva',
  organizacional_simetria: 'Simetria Hemisférica',
  organizacional_gradientes: 'Gradientes',
  organizacional_topografia: 'Topografia',
  organizacional_complexidade: 'Complexidade',
  funcional_atencao_sustentada: 'Atenção Sustentada',
  funcional_atencao_seletiva: 'Atenção Seletiva',
  funcional_controle_inibitorio: 'Controle Inibitório',
  funcional_flexibilidade: 'Flexibilidade',
  funcional_memoria_trabalho: 'Memória de Trabalho',
  funcional_processamento_emocional: 'Processamento Emocional',
  funcional_big_five: 'Big Five',
  rdoc_valencia_negativa: 'Valência Negativa',
  rdoc_valencia_positiva: 'Valência Positiva',
  rdoc_arousal_regulacao: 'Arousal',
  rdoc_sistemas_cognitivos: 'Sistemas Cognitivos',
  rdoc_sistemas_sociais: 'Processos Sociais',
  rdoc_regulacao_sensoriomotora: 'Regulação Sensório-motora',
  neurobiologica_metabolismo: 'Perfil Metabólico',
  neurobiologica_inflamacao: 'Inflamação',
  neurobiologica_sono: 'Qualidade do Sono',
  neurobiologica_hrv: 'VFC (HRV)',
  neurobiologica_ciclo_menstrual: 'Ciclo Menstrual',
  neurobiologica_dieta: 'Dieta',
  neurobiologica_intestino: 'Intestino',
  temporal_traumas: 'Traumas Relevantes',
  temporal_perdas: 'Perdas Significativas',
  temporal_classificacao_perdas: 'Classificação de Luto',
  temporal_evolucao: 'Evolução do Quadro',
  temporal_resposta_intervencoes: 'Resposta a Intervenções',
  convergencia_risco_clinico: 'Risco Clínico',
  convergencia_estado_neurofuncional: 'Estado Neurofuncional',
  convergencia_vetor_adaptativo: 'Vetor Adaptativo',
  convergencia_resumo: 'Síntese Convergente',
}

function JsonPreview({ control, pacienteId }: { control: any; pacienteId: string }) {
  const values = useWatch({ control })

  const missingFields = useMemo(() => {
    return REQUIRED_FIELDS.filter(
      (f) => values[f] === undefined || values[f] === '' || values[f] === null,
    )
  }, [values])

  const confidenceLevel =
    REQUIRED_FIELDS.length > 0
      ? (REQUIRED_FIELDS.length - missingFields.length) / REQUIRED_FIELDS.length
      : 0

  const convergenceScore = useMemo(() => {
    let sum = 0
    let count = 0
    for (const f of NUMERIC_FIELDS) {
      if (values[f] !== undefined && values[f] !== '' && values[f] !== null) {
        sum += Number(values[f])
        count++
      }
    }
    return count > 0 ? Math.round((sum / count) * 10) : 0
  }, [values])

  const getVal = (field: string) => {
    const v = values[field]
    return v !== undefined && v !== '' && v !== null ? v : 'low_confidence'
  }

  const jsonPreview = {
    patient_id: pacienteId || 'UUID',
    timestamp: new Date().toISOString(),
    neuroEnergy: getVal('neuroenergetica_potencia'),
    networkIntegration: getVal('integracao_coerencia'),
    organization: getVal('organizacional_simetria'),
    cognitiveFunction: {
      atencao_sustentada: getVal('funcional_atencao_sustentada'),
      atencao_seletiva: getVal('funcional_atencao_seletiva'),
      controle_inibitorio: getVal('funcional_controle_inibitorio'),
      flexibilidade: getVal('funcional_flexibilidade'),
      memoria_trabalho: getVal('funcional_memoria_trabalho'),
      processamento_emocional: getVal('funcional_processamento_emocional'),
    },
    rdocDomains: {
      valencia_negativa: getVal('rdoc_valencia_negativa'),
      valencia_positiva: getVal('rdoc_valencia_positiva'),
      sistemas_cognitivos: getVal('rdoc_sistemas_cognitivos'),
      sistemas_sociais: getVal('rdoc_sistemas_sociais'),
      regulacao_sensoriomotora: getVal('rdoc_regulacao_sensoriomotora'),
      arousal_regulacao: getVal('rdoc_arousal_regulacao'),
    },
    bioMarkers: {
      metabolismo: getVal('neurobiologica_metabolismo'),
      inflamacao: getVal('neurobiologica_inflamacao'),
      sono: getVal('neurobiologica_sono'),
      hrv: getVal('neurobiologica_hrv'),
    },
    temporalIndex: {
      traumas: getVal('temporal_traumas'),
      perdas: getVal('temporal_perdas'),
      evolucao: getVal('temporal_evolucao'),
    },
    convergenceScore,
    confidenceLevel: Number(confidenceLevel.toFixed(2)),
    classification:
      getVal('neuroenergetica_variabilidade') !== 'low_confidence'
        ? String(values.neuroenergetica_variabilidade).toLowerCase()
        : 'low_confidence',
    integrationStatus:
      getVal('integracao_dmn') !== 'low_confidence'
        ? String(values.integracao_dmn).toLowerCase()
        : 'low_confidence',
    organizationStatus:
      getVal('organizacional_simetria') !== 'low_confidence'
        ? Number(values.organizacional_simetria) > 5
          ? 'coerente'
          : 'difuso'
        : 'low_confidence',
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-xl overflow-hidden text-slate-300 font-mono text-xs shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2 text-slate-100 font-sans text-sm font-semibold">
          <Code className="w-4 h-4 text-primary" />
          JSON Preview
        </div>
        <div className="flex items-center gap-2">
          {missingFields.length === 0 ? (
            <span className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded text-[10px] font-sans font-bold">
              <CheckCircle2 className="w-3 h-3" />
              100% COMPLETE
            </span>
          ) : (
            <span className="text-amber-400 bg-amber-400/10 px-2 py-1 rounded text-[10px] font-sans font-bold">
              {Math.round(confidenceLevel * 100)}% CONFIDENCE
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <pre className="text-[11px] leading-relaxed text-slate-300">
          {JSON.stringify(jsonPreview, null, 2)}
        </pre>

        {missingFields.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
            <h4 className="text-amber-400 font-sans font-semibold flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4" />
              Avisos de Validação
            </h4>
            <ul className="space-y-1">
              {missingFields.slice(0, 10).map((f) => (
                <li key={f} className="text-slate-400 text-[10px]">
                  Campo <strong className="text-amber-200/80">{FIELD_NAMES_MAP[f] || f}</strong> não
                  preenchido — confiança reduzida
                </li>
              ))}
              {missingFields.length > 10 && (
                <li className="text-slate-500 text-[10px] italic">
                  ...e mais {missingFields.length - 10} campos.
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default function NovoDNDA() {
  const { id, dndaId } = useParams<{ id: string; dndaId?: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()

  const [paciente, setPaciente] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const methods = useForm({
    defaultValues: {
      intervencao_base: false,
      intervencao_integracao: false,
      intervencao_especializacao: false,
      intervencao_neuromodulacao_tdcs: false,
      intervencao_neuromodulacao_tacs: false,
      intervencao_neuromodulacao_reac: false,
      intervencao_neuromodulacao_tms: false,
      intervencao_neurofeedback: false,
      intervencao_biofeedback: false,
    },
  })

  const values = methods.watch()
  const missingFields = useMemo(() => {
    return REQUIRED_FIELDS.filter(
      (f) =>
        values[f as keyof typeof values] === undefined ||
        values[f as keyof typeof values] === '' ||
        values[f as keyof typeof values] === null,
    )
  }, [values])
  const isComplete = missingFields.length === 0

  useEffect(() => {
    const loadData = async () => {
      try {
        if (id) {
          const pac = await getPaciente(id)
          setPaciente(pac)
        }
        if (dndaId) {
          const dnda = await getDnda(dndaId)
          methods.reset(dnda)
        }
      } catch (e) {
        toast({ title: 'Erro ao carregar dados', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id, dndaId])

  const onSubmit = async (data: any) => {
    if (!paciente?.id || !user?.id) {
      toast({ title: 'Sessão inválida', variant: 'destructive' })
      return
    }

    if (!isComplete) {
      toast({
        title: 'Erro de validação',
        description: 'Complete todas as dimensões antes de salvar.',
        variant: 'destructive',
      })
      return
    }

    try {
      setSaving(true)
      const payload = {
        ...data,
        paciente_id: paciente.id,
        usuario_id: user.id,
      }

      if (dndaId) {
        await pb.collection('dnda').update(dndaId, payload)
        toast({
          title: 'DNDA padronizado atualizado!',
          className: 'bg-success text-white border-none',
        })
      } else {
        await createDnda(payload)
        toast({
          title: 'DNDA padronizado com sucesso!',
          className: 'bg-success text-white border-none',
        })
      }

      // Maintain JSON preview state while gently navigating back after save
      setTimeout(() => navigate(`/pacientes/${paciente.id}`), 1000)
    } catch (err) {
      toast({ title: 'Erro ao salvar DNDA™', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-[1400px] px-4 md:px-8 mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <Skeleton className="xl:col-span-2 h-[500px] rounded-xl" />
          <Skeleton className="xl:col-span-1 h-[500px] rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] px-4 md:px-8 mx-auto space-y-8 animate-fade-in-up pb-20 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button variant="ghost" className="gap-2 -ml-4 text-slate-500 hover:text-slate-900" asChild>
          <Link to={`/pacientes/${id}`}>
            <ArrowLeft className="w-4 h-4" /> Voltar para Paciente
          </Link>
        </Button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 mb-2">
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            {dndaId ? 'Editar Avaliação' : 'Nova Avaliação'}
          </div>
          <span className="text-slate-400 text-sm font-semibold">Estrutura Computável</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Padronização DNDA™ — Estrutura Computável
        </h1>
        <p className="text-slate-500 mt-2">
          Paciente: <strong className="text-slate-700">{paciente?.nome}</strong>
        </p>

        {!dndaId && (
          <Alert className="mt-6 bg-blue-50/50 border-blue-100 text-blue-800">
            <AlertTitle className="text-blue-900 font-semibold">
              Instruções de Preenchimento
            </AlertTitle>
            <AlertDescription className="text-blue-700/80 mt-1">
              Preencha todas as 9 dimensões do DNDA™ para habilitar o salvamento. Os valores
              inseridos alimentarão automaticamente a estrutura computável (JSON) necessária para
              relatórios avançados e análise de dados.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          <FormProvider {...methods}>
            <form
              onSubmit={methods.handleSubmit(onSubmit)}
              className="space-y-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
            >
              <Tabs defaultValue="d1" className="w-full">
                <TabsList className="w-full flex-wrap h-auto gap-2 p-1 bg-slate-50 justify-start">
                  <TabsTrigger
                    value="d1"
                    className="flex-1 min-w-[100px] data-[state=active]:shadow-sm"
                  >
                    1. Neuro
                  </TabsTrigger>
                  <TabsTrigger
                    value="d2"
                    className="flex-1 min-w-[100px] data-[state=active]:shadow-sm"
                  >
                    2. Integr
                  </TabsTrigger>
                  <TabsTrigger
                    value="d3"
                    className="flex-1 min-w-[100px] data-[state=active]:shadow-sm"
                  >
                    3. Org
                  </TabsTrigger>
                  <TabsTrigger
                    value="d4"
                    className="flex-1 min-w-[100px] data-[state=active]:shadow-sm"
                  >
                    4. Func
                  </TabsTrigger>
                  <TabsTrigger
                    value="d5"
                    className="flex-1 min-w-[100px] data-[state=active]:shadow-sm"
                  >
                    5. RDoC
                  </TabsTrigger>
                  <TabsTrigger
                    value="d6"
                    className="flex-1 min-w-[100px] data-[state=active]:shadow-sm"
                  >
                    6. Bio
                  </TabsTrigger>
                  <TabsTrigger
                    value="d7"
                    className="flex-1 min-w-[100px] data-[state=active]:shadow-sm"
                  >
                    7. Temp
                  </TabsTrigger>
                  <TabsTrigger
                    value="d8"
                    className="flex-1 min-w-[100px] data-[state=active]:shadow-sm"
                  >
                    8. Conv
                  </TabsTrigger>
                  <TabsTrigger
                    value="d9"
                    className="flex-1 min-w-[100px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    9. Interv
                  </TabsTrigger>
                </TabsList>

                <Tabs1To3 />
                <Tabs4To6 />
                <Tabs7To9 />
              </Tabs>

              {!isComplete && (
                <Alert variant="destructive" className="mt-8 bg-red-50/50 border-red-100">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <AlertTitle className="text-red-800 font-semibold">
                    Validação Incompleta
                  </AlertTitle>
                  <AlertDescription className="text-red-700/90 mt-1">
                    Complete todas as dimensões:{' '}
                    {missingFields
                      .slice(0, 5)
                      .map((f) => FIELD_NAMES_MAP[f] || f)
                      .join(', ')}
                    {missingFields.length > 5 && (
                      <span className="font-semibold">
                        {' '}
                        e mais {missingFields.length - 5} dimensões faltantes.
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end pt-8 border-t mt-8">
                <Button
                  type="submit"
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 gap-2 transition-all"
                  disabled={saving || !isComplete}
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {saving ? 'Salvando...' : 'Salvar DNDA Padronizado'}
                </Button>
              </div>
            </form>
          </FormProvider>
        </div>

        <div className="hidden xl:block h-[calc(100vh-120px)] sticky top-6">
          <JsonPreview control={methods.control} pacienteId={paciente?.id || ''} />
        </div>
      </div>

      <div className="xl:hidden fixed bottom-6 right-6 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="icon"
              className="h-14 w-14 rounded-full shadow-2xl bg-slate-900 hover:bg-slate-800 text-white border-2 border-white/10 ring-4 ring-slate-900/20"
            >
              <Code className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="h-[85vh] p-0 bg-slate-950 border-t-slate-800 rounded-t-2xl overflow-hidden"
          >
            <JsonPreview control={methods.control} pacienteId={paciente?.id || ''} />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}

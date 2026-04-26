import { useEffect, useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useForm, FormProvider, useWatch } from 'react-hook-form'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { getPaciente } from '@/services/pacientes'
import { createDnda, updateDnda, getDnda } from '@/services/dnda'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import {
  ArrowLeft,
  Save,
  Code,
  AlertTriangle,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

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

function JsonPreview({
  control,
  pacienteId,
  isMobile,
}: {
  control: any
  pacienteId: string
  isMobile?: boolean
}) {
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
    return count > 0 ? Math.round((sum / (count * 10)) * 100) : 0
  }, [values])

  const getVal = (field: string) => {
    const v = values[field]
    return v !== undefined && v !== '' && v !== null ? v : 'low_confidence'
  }

  const jsonPreview = {
    paciente_id: pacienteId || 'UUID',
    timestamp: new Date().toISOString(),
    neuro_energy: getVal('neuroenergetica_potencia'),
    network_integration: getVal('integracao_coerencia'),
    organization: getVal('organizacional_simetria'),
    cognitive_function: {
      atencao_sustentada: getVal('funcional_atencao_sustentada'),
      atencao_seletiva: getVal('funcional_atencao_seletiva'),
      controle_inibitorio: getVal('funcional_controle_inibitorio'),
      flexibilidade: getVal('funcional_flexibilidade'),
      memoria_trabalho: getVal('funcional_memoria_trabalho'),
      processamento_emocional: getVal('funcional_processamento_emocional'),
    },
    rdoc_domains: {
      valencia_negativa: getVal('rdoc_valencia_negativa'),
      valencia_positiva: getVal('rdoc_valencia_positiva'),
      sistemas_cognitivos: getVal('rdoc_sistemas_cognitivos'),
      sistemas_sociais: getVal('rdoc_sistemas_sociais'),
      regulacao_sensoriomotora: getVal('rdoc_regulacao_sensoriomotora'),
      arousal_regulacao: getVal('rdoc_arousal_regulacao'),
    },
    bio_markers: {
      metabolismo: getVal('neurobiologica_metabolismo'),
      inflamacao: getVal('neurobiologica_inflamacao'),
      sono: getVal('neurobiologica_sono'),
      hrv: getVal('neurobiologica_hrv'),
    },
    temporal_index: {
      traumas: getVal('temporal_traumas'),
      perdas: getVal('temporal_perdas'),
      evolucao: getVal('temporal_evolucao'),
    },
    convergence_score: convergenceScore,
    confidence_level: Number(confidenceLevel.toFixed(2)),
    classification:
      getVal('neuroenergetica_variabilidade') !== 'low_confidence'
        ? String(values.neuroenergetica_variabilidade).toLowerCase()
        : 'instável',
    integration_status:
      getVal('integracao_dmn') !== 'low_confidence'
        ? String(values.integracao_dmn).toLowerCase()
        : 'desacoplado',
    organization_status:
      getVal('organizacional_simetria') !== 'low_confidence'
        ? Number(values.organizacional_simetria) > 5
          ? 'coerente'
          : 'difuso'
        : 'difuso',
  }

  return (
    <div
      className={cn(
        'flex flex-col bg-slate-950 text-slate-300 shadow-xl',
        isMobile ? 'h-full' : 'h-full rounded-xl overflow-hidden',
      )}
    >
      {!isMobile && (
        <div className="flex items-center justify-between p-[20px] bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2 text-slate-100 text-[14px] font-semibold">
            <Code className="w-4 h-4 text-primary" />
            JSON Preview
          </div>
          <div className="flex items-center gap-2">
            {missingFields.length === 0 ? (
              <span className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded text-[12px] font-bold">
                <CheckCircle2 className="w-3 h-3" />
                100% COMPLETE
              </span>
            ) : (
              <span className="text-amber-400 bg-amber-400/10 px-2 py-1 rounded text-[12px] font-bold">
                {Math.round(confidenceLevel * 100)}% CONFIDENCE
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-[20px] space-y-[16px]">
        {isMobile && missingFields.length === 0 && (
          <div className="mb-4 inline-flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded text-[12px] font-bold">
            <CheckCircle2 className="w-4 h-4" />
            100% COMPLETE
          </div>
        )}

        <pre className="text-[12px] font-mono leading-relaxed text-slate-300 transition-all duration-200">
          {JSON.stringify(jsonPreview, null, 2)}
        </pre>

        {missingFields.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-800 space-y-[16px]">
            <h4 className="text-amber-400 text-[16px] font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Avisos de Validação
            </h4>
            <ul className="space-y-2">
              {missingFields.slice(0, 10).map((f) => (
                <li
                  key={f}
                  className="text-slate-400 text-[14px] font-normal flex items-start gap-2 leading-tight"
                >
                  <span className="mt-0.5">⚠️</span>
                  <span>
                    Campo <strong className="text-amber-200/80">{FIELD_NAMES_MAP[f] || f}</strong>{' '}
                    não preenchido — confiança reduzida
                  </span>
                </li>
              ))}
              {missingFields.length > 10 && (
                <li className="text-slate-500 text-[14px] italic">
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
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false)

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
          if (dnda.raw_data) {
            methods.reset(dnda.raw_data)
          } else {
            methods.reset(dnda)
          }
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
      const confidenceLevel =
        REQUIRED_FIELDS.length > 0
          ? (REQUIRED_FIELDS.length - missingFields.length) / REQUIRED_FIELDS.length
          : 0

      let sum = 0
      let count = 0
      for (const f of NUMERIC_FIELDS) {
        if (data[f] !== undefined && data[f] !== '' && data[f] !== null) {
          sum += Number(data[f])
          count++
        }
      }
      const convergenceScoreValue = count > 0 ? Math.round((sum / (count * 10)) * 100) : 0

      let classificationValue = 'instável'
      if (data.neuroenergetica_variabilidade === 'Normal') classificationValue = 'estável'
      else if (data.neuroenergetica_variabilidade === 'Rígido') classificationValue = 'hipoativo'
      else if (data.neuroenergetica_variabilidade === 'Instável') classificationValue = 'instável'

      const payload: any = {
        usuario_id: user.id,
        paciente_id: paciente.id,
        timestamp: new Date().toISOString(),
        convergence_score: convergenceScoreValue,
        neuro_energy: Number(data.neuroenergetica_potencia || 0),
        network_integration: Number(data.integracao_coerencia || 0),
        organization: Number(data.organizacional_simetria || 0),
        cognitive_function: {
          atencao_sustentada: Number(data.funcional_atencao_sustentada || 0),
          atencao_seletiva: Number(data.funcional_atencao_seletiva || 0),
          controle_inibitorio: Number(data.funcional_controle_inibitorio || 0),
          flexibilidade: Number(data.funcional_flexibilidade || 0),
          memoria_trabalho: Number(data.funcional_memoria_trabalho || 0),
          processamento_emocional: Number(data.funcional_processamento_emocional || 0),
        },
        rdoc_domains: {
          valencia_negativa: Number(data.rdoc_valencia_negativa || 0),
          valencia_positiva: Number(data.rdoc_valencia_positiva || 0),
          sistemas_cognitivos: Number(data.rdoc_sistemas_cognitivos || 0),
          sistemas_sociais: Number(data.rdoc_sistemas_sociais || 0),
          regulacao_sensoriomotora: Number(data.rdoc_regulacao_sensoriomotora || 0),
          arousal_regulacao: Number(data.rdoc_arousal_regulacao || 0),
        },
        bio_markers: {
          metabolismo: Number(data.neurobiologica_metabolismo || 0),
          inflamacao: Number(data.neurobiologica_inflamacao || 0),
          sono: Number(data.neurobiologica_sono || 0),
          hrv: Number(data.neurobiologica_hrv || 0),
        },
        temporal_index: {
          traumas: data.temporal_traumas || '',
          perdas: data.temporal_perdas || '',
          evolucao: data.temporal_evolucao || '',
        },
        confidence_level: confidenceLevel,
        classification: classificationValue,
        integration_status: data.integracao_dmn
          ? String(data.integracao_dmn).toLowerCase()
          : 'desacoplado',
        organization_status: data.organizacional_simetria
          ? Number(data.organizacional_simetria) > 5
            ? 'coerente'
            : 'difuso'
          : 'difuso',
        raw_data: data,

        // Native columns mapping
        neuroenergetica_potencia: Number(data.neuroenergetica_potencia || 0),
        neuroenergetica_tbr: Number(data.neuroenergetica_tbr || 0),
        neuroenergetica_excitacao: Number(data.neuroenergetica_excitacao || 0),

        integracao_coerencia: Number(data.integracao_coerencia || 0),
        integracao_conectividade: Number(data.integracao_conectividade || 0),

        organizacional_simetria: Number(data.organizacional_simetria || 0),
        organizacional_gradientes: Number(data.organizacional_gradientes || 0),
        organizacional_topografia: Number(data.organizacional_topografia || 0),
        organizacional_complexidade: Number(data.organizacional_complexidade || 0),

        funcional_atencao_sustentada: Number(data.funcional_atencao_sustentada || 0),
        funcional_atencao_seletiva: Number(data.funcional_atencao_seletiva || 0),
        funcional_controle_inibitorio: Number(data.funcional_controle_inibitorio || 0),
        funcional_flexibilidade: Number(data.funcional_flexibilidade || 0),
        funcional_memoria_trabalho: Number(data.funcional_memoria_trabalho || 0),
        funcional_processamento_emocional: Number(data.funcional_processamento_emocional || 0),

        rdoc_valencia_negativa: Number(data.rdoc_valencia_negativa || 0),
        rdoc_valencia_positiva: Number(data.rdoc_valencia_positiva || 0),
        rdoc_sistemas_cognitivos: Number(data.rdoc_sistemas_cognitivos || 0),
        rdoc_sistemas_sociais: Number(data.rdoc_sistemas_sociais || 0),
        rdoc_regulacao_sensoriomotora: Number(data.rdoc_regulacao_sensoriomotora || 0),
        rdoc_arousal_regulacao: Number(data.rdoc_arousal_regulacao || 0),

        neurobiologica_metabolismo: Number(data.neurobiologica_metabolismo || 0),
        neurobiologica_inflamacao: Number(data.neurobiologica_inflamacao || 0),
        neurobiologica_sono: Number(data.neurobiologica_sono || 0),
        neurobiologica_hrv: Number(data.neurobiologica_hrv || 0),

        temporal_traumas: data.temporal_traumas || '',
        temporal_perdas: data.temporal_perdas || '',
        temporal_evolucao: data.temporal_evolucao || '',
        temporal_resposta_intervencoes: data.temporal_resposta_intervencoes || '',

        convergencia_estado_neurofuncional: data.convergencia_estado_neurofuncional || '',
        convergencia_vetor_adaptativo: data.convergencia_vetor_adaptativo || '',
        convergencia_resumo: data.convergencia_resumo || '',

        intervencao_base: Boolean(data.intervencao_base),
        intervencao_integracao: Boolean(data.intervencao_integracao),
        intervencao_especializacao: Boolean(data.intervencao_especializacao),
        intervencao_neuromodulacao_tdcs: Boolean(data.intervencao_neuromodulacao_tdcs),
        intervencao_neuromodulacao_tacs: Boolean(data.intervencao_neuromodulacao_tacs),
        intervencao_neuromodulacao_reac: Boolean(data.intervencao_neuromodulacao_reac),
        intervencao_neuromodulacao_tms: Boolean(data.intervencao_neuromodulacao_tms),
        intervencao_neurofeedback: Boolean(data.intervencao_neurofeedback),
        intervencao_biofeedback: Boolean(data.intervencao_biofeedback),
      }

      if (data.neuroenergetica_variabilidade)
        payload.neuroenergetica_variabilidade = data.neuroenergetica_variabilidade
      if (data.integracao_dmn) payload.integracao_dmn = data.integracao_dmn
      if (data.integracao_salience) payload.integracao_salience = data.integracao_salience
      if (data.integracao_executive) payload.integracao_executive = data.integracao_executive
      if (data.funcional_big_five) payload.funcional_big_five = data.funcional_big_five
      if (data.neurobiologica_ciclo_menstrual)
        payload.neurobiologica_ciclo_menstrual = data.neurobiologica_ciclo_menstrual
      if (data.neurobiologica_dieta) payload.neurobiologica_dieta = data.neurobiologica_dieta
      if (data.neurobiologica_intestino)
        payload.neurobiologica_intestino = data.neurobiologica_intestino
      if (data.temporal_classificacao_perdas)
        payload.temporal_classificacao_perdas = data.temporal_classificacao_perdas
      if (data.convergencia_risco_clinico)
        payload.convergencia_risco_clinico = data.convergencia_risco_clinico

      if (dndaId) {
        await updateDnda(dndaId, payload)
        toast({
          title: 'DNDA padronizado com sucesso!',
          className: 'bg-success text-white border-none',
        })
      } else {
        await createDnda(payload)
        toast({
          title: 'DNDA padronizado com sucesso!',
          className: 'bg-success text-white border-none',
        })
      }

      setTimeout(() => navigate(`/pacientes/${paciente.id}`), 1000)
    } catch (err) {
      const fieldErrors = extractFieldErrors(err)
      const errorMsg = getErrorMessage(err)
      const errorDetails =
        Object.keys(fieldErrors).length > 0
          ? Object.entries(fieldErrors)
              .map(([k, v]) => {
                const ptMsg =
                  v === 'Missing required value.'
                    ? 'Campo obrigatório'
                    : v === 'Invalid value.'
                      ? 'Valor inválido'
                      : v
                return `${k}: ${ptMsg}`
              })
              .join('\n')
          : errorMsg

      toast({
        title: 'Erro de validação DNDA™',
        description: errorDetails || 'Verifique se todos os dados estão preenchidos corretamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-[1400px] px-4 md:px-8 mx-auto space-y-[32px] py-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-[32px]">
          <Skeleton className="xl:col-span-2 h-[500px] rounded-xl" />
          <Skeleton className="xl:col-span-1 h-[500px] rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] px-4 md:px-8 mx-auto space-y-[32px] py-8 animate-fade-in relative pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button
          variant="ghost"
          className="gap-2 -ml-4 text-[14px] font-normal text-slate-500 hover:text-slate-900"
          asChild
        >
          <Link to={`/pacientes/${id}`}>
            <ArrowLeft className="w-4 h-4" /> Voltar para Paciente
          </Link>
        </Button>
      </div>

      <div className="bg-white p-[20px] rounded-xl border border-slate-200 shadow-sm space-y-[16px]">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider">
            {dndaId ? 'Editar Avaliação' : 'Nova Avaliação'}
          </div>
          <span className="text-slate-400 text-[14px] font-semibold">Estrutura Computável</span>
        </div>
        <h1 className="text-[24px] font-bold text-slate-900">
          Padronizar DNDA™ — Estrutura Computável
        </h1>
        <p className="text-[14px] font-normal text-slate-500">
          Paciente: <strong className="text-slate-700">{paciente?.nome}</strong>
        </p>

        {!dndaId && (
          <Alert className="bg-blue-50/50 border-blue-100 text-blue-800">
            <AlertTitle className="text-[16px] text-blue-900 font-semibold">
              Instruções de Preenchimento
            </AlertTitle>
            <AlertDescription className="text-[14px] text-blue-700/80 mt-1 font-normal">
              Preencha todas as 9 dimensões do DNDA™ para habilitar o salvamento. Os valores
              inseridos alimentarão automaticamente a estrutura computável (JSON) necessária para
              relatórios avançados e análise de dados.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-[32px]">
        <div className="xl:col-span-2">
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-[32px]">
              <Tabs defaultValue="d1" className="w-full">
                <TabsList className="w-full flex-wrap h-auto gap-[8px] p-2 bg-slate-50 justify-start rounded-lg border border-slate-200">
                  <TabsTrigger
                    value="d1"
                    className="flex-1 min-w-[100px] text-[14px] font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    1. Neuro
                  </TabsTrigger>
                  <TabsTrigger
                    value="d2"
                    className="flex-1 min-w-[100px] text-[14px] font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    2. Integr
                  </TabsTrigger>
                  <TabsTrigger
                    value="d3"
                    className="flex-1 min-w-[100px] text-[14px] font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    3. Org
                  </TabsTrigger>
                  <TabsTrigger
                    value="d4"
                    className="flex-1 min-w-[100px] text-[14px] font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    4. Func
                  </TabsTrigger>
                  <TabsTrigger
                    value="d5"
                    className="flex-1 min-w-[100px] text-[14px] font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    5. RDoC
                  </TabsTrigger>
                  <TabsTrigger
                    value="d6"
                    className="flex-1 min-w-[100px] text-[14px] font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    6. Bio
                  </TabsTrigger>
                  <TabsTrigger
                    value="d7"
                    className="flex-1 min-w-[100px] text-[14px] font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    7. Temp
                  </TabsTrigger>
                  <TabsTrigger
                    value="d8"
                    className="flex-1 min-w-[100px] text-[14px] font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    8. Conv
                  </TabsTrigger>
                  <TabsTrigger
                    value="d9"
                    className="flex-1 min-w-[100px] text-[14px] font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
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
                  <AlertTitle className="text-[16px] text-red-800 font-semibold">
                    Validação Incompleta
                  </AlertTitle>
                  <AlertDescription className="text-[14px] text-red-700/90 mt-1 font-normal">
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
                  className="bg-primary hover:bg-primary/90 text-white text-[16px] font-semibold px-8 gap-2 transition-all"
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

      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950 border-t border-slate-800 rounded-t-xl shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        <Collapsible open={isMobilePreviewOpen} onOpenChange={setIsMobilePreviewOpen}>
          <CollapsibleTrigger className="w-full flex items-center justify-between p-[20px] text-slate-100 hover:bg-slate-900 transition-colors rounded-t-xl">
            <div className="flex items-center gap-2 font-semibold text-[14px]">
              <Code className="w-4 h-4 text-primary" /> Preview JSON
            </div>
            {isMobilePreviewOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="bg-slate-950 max-h-[70vh] overflow-y-auto border-t border-slate-800">
            <JsonPreview control={methods.control} pacienteId={paciente?.id || ''} isMobile />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}

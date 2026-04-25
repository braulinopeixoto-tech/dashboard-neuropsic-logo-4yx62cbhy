import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { getPaciente } from '@/services/pacientes'
import { createDnda } from '@/services/dnda'
import { ArrowLeft, Save } from 'lucide-react'

import { Tabs1To3 } from '@/components/dnda/Tabs1To3'
import { Tabs4To6 } from '@/components/dnda/Tabs4To6'
import { Tabs7To9 } from '@/components/dnda/Tabs7To9'

export default function NovoDNDA() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()

  const [paciente, setPaciente] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const methods = useForm({
    defaultValues: {
      d9_phases: [],
      d9_tools: [],
    },
  })
  const { watch, setValue, handleSubmit } = methods

  useEffect(() => {
    if (id) {
      getPaciente(id)
        .then(setPaciente)
        .catch(() => toast({ title: 'Erro ao carregar paciente', variant: 'destructive' }))
        .finally(() => setLoading(false))
    }
  }, [id])

  const d1_excitation = watch('d1_excitation') || 0
  const d3_entropy = watch('d3_entropy') || 0
  const d1_class = watch('d1_class')
  const d3_class = watch('d3_class')

  useEffect(() => {
    if (d1_excitation > 7) setValue('d1_class', 'hiperativo')
    else if (d1_excitation < 4) setValue('d1_class', 'hipoativo')
    else setValue('d1_class', 'instável')
  }, [d1_excitation, setValue])

  useEffect(() => {
    if (d3_entropy > 7) setValue('d3_class', 'desorganizado')
    else if (d3_entropy < 4) setValue('d3_class', 'coerente')
    else setValue('d3_class', 'difuso')
  }, [d3_entropy, setValue])

  useEffect(() => {
    let risk = 'baixo'
    if (d1_excitation > 7 || d3_entropy > 7) risk = 'alto'
    else if (d1_excitation > 5 || d3_entropy > 5) risk = 'médio'
    setValue('d8_risk', risk)

    const summary = `Paciente apresenta padrão neuroenergético classificado como ${d1_class || 'indefinido'}, com organização espacial ${d3_class || 'indefinida'}. O nível de excitação global é ${d1_excitation}/10 e a entropia de sinal é ${d3_entropy}/10. O risco clínico estimado pelas métricas fundamentais é ${risk.toUpperCase()}.`
    setValue('d8_summary', summary)
  }, [d1_class, d3_class, d1_excitation, d3_entropy, setValue])

  const onSubmit = async (data: any) => {
    if (!paciente?.id || !user?.id) {
      toast({ title: 'Sessão inválida', variant: 'destructive' })
      return
    }

    try {
      setSaving(true)
      const payload = {
        ...data,
        paciente_id: paciente.id,
        usuario_id: user.id,
      }
      await createDnda(payload)
      toast({
        title: 'DNDA™ salva com sucesso!',
        description: 'A avaliação dimensional foi registrada no histórico do paciente.',
        className: 'bg-success text-white border-none',
      })
      navigate(`/pacientes/${paciente.id}`)
    } catch (err) {
      toast({ title: 'Erro ao salvar DNDA™', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up pb-20">
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
            Nova Avaliação
          </div>
          <span className="text-slate-400 text-sm">Draft</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Diagnóstico Neurofuncional Dimensional Auditável (DNDA™)
        </h1>
        <p className="text-slate-500 mt-1">
          Paciente: <strong className="text-slate-700">{paciente?.nome}</strong>
        </p>
      </div>

      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit(onSubmit)}
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

          <div className="flex justify-end pt-8 border-t mt-8">
            <Button
              type="submit"
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 gap-2"
              disabled={saving}
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {saving ? 'Salvando...' : 'Salvar DNDA™'}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { getPaciente } from '@/services/pacientes'
import { criarAnamnese } from '@/services/anamneses'
import { QueixaSection } from '@/components/anamnese/QueixaSection'
import { HistoriaSection } from '@/components/anamnese/HistoriaSection'
import { ExameFisicoSection } from '@/components/anamnese/ExameFisicoSection'
import { ImpressaoSection } from '@/components/anamnese/ImpressaoSection'

export default function NovaAnamnese() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [paciente, setPaciente] = useState<any>(null)

  const [queixa, setQueixa] = useState<any>(null)
  const [resumo, setResumo] = useState('')
  const [exameFisico, setExameFisico] = useState({})
  const [impressao, setImpressao] = useState('')

  useEffect(() => {
    if (id)
      getPaciente(id)
        .then(setPaciente)
        .catch(() => {})
  }, [id])

  const handleSave = async () => {
    if (!id) return
    try {
      const imc = (() => {
        const w = parseFloat((exameFisico as any).peso)
        const h = parseFloat((exameFisico as any).altura) / 100
        return w > 0 && h > 0 ? (w / (h * h)).toFixed(1) : ''
      })()

      await criarAnamnese({
        paciente_id: id,
        queixa_estruturada: queixa || {},
        historia_resumo: resumo,
        exame_fisico: { ...exameFisico, imc },
        impressao_clinica: impressao,
      })
      toast({ title: 'Sucesso', description: 'Anamnese estruturada com sucesso!' })
      navigate(`/pacientes/${id}`)
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao salvar a anamnese.', variant: 'destructive' })
    }
  }

  if (!paciente)
    return <div className="p-12 text-center text-slate-500">Carregando dados do paciente...</div>

  return (
    <div className="max-w-[1000px] mx-auto space-y-8 pb-20 animate-fade-in-up">
      <div className="flex flex-col gap-2">
        <Button
          variant="ghost"
          className="w-fit gap-2 -ml-4 text-slate-500 hover:text-slate-900"
          asChild
        >
          <Link to={`/pacientes/${id}`}>
            <ArrowLeft className="w-4 h-4" /> Voltar para Perfil
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Anamnese Estruturada — Assistida por IA
          </h1>
          <p className="text-slate-500 mt-1">
            Paciente: <span className="font-semibold text-slate-700">{paciente.nome}</span>
          </p>
        </div>
      </div>

      <div className="space-y-10">
        <section>
          <h2 className="text-xl font-bold mb-4 text-slate-800 border-b pb-2">
            1. Queixa Principal
          </h2>
          <QueixaSection pacienteId={id!} value={queixa} onChange={setQueixa} />
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4 text-slate-800 border-b pb-2">
            2. História Clínica
          </h2>
          <HistoriaSection pacienteId={id!} value={resumo} onChange={setResumo} />
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4 text-slate-800 border-b pb-2">3. Exame Físico</h2>
          <ExameFisicoSection value={exameFisico} onChange={setExameFisico} />
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4 text-slate-800 border-b pb-2">
            4. Impressão Clínica
          </h2>
          <ImpressaoSection
            pacienteId={id!}
            context={{ queixa, resumo, exame_fisico: exameFisico }}
            value={impressao}
            onChange={setImpressao}
          />
        </section>

        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t">
          <Button variant="outline" className="w-full sm:w-auto" asChild>
            <Link to={`/pacientes/${id}`}>Cancelar</Link>
          </Button>
          <Button
            onClick={handleSave}
            className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground"
          >
            <Save className="w-4 h-4" /> Confirmar Anamnese
          </Button>
        </div>
      </div>
    </div>
  )
}

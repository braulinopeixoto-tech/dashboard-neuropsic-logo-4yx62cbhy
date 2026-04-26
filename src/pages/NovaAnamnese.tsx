import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
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

  const [queixaData, setQueixaData] = useState({ raw: '', struct: null as any })
  const [historiaData, setHistoriaData] = useState({
    raw: {
      pessoais: '',
      familiares: '',
      medicacoes: [] as string[],
      alergias: [] as string[],
      cirurgias: [] as string[],
      traumas: '',
      perdas: '',
    },
    resumo: '',
  })
  const [exameFisico, setExameFisico] = useState<any>({})
  const [impressaoData, setImpressaoData] = useState({ texto: '', isAi: false })

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
        queixa_principal: queixaData.raw,
        queixa_estruturada: queixaData.struct || {},
        historia_clinica: JSON.stringify(historiaData.raw),
        historia_resumida: historiaData.resumo,
        antecedentes_pessoais: historiaData.raw.pessoais,
        antecedentes_familiares: historiaData.raw.familiares,
        medicacoes: historiaData.raw.medicacoes,
        alergias: historiaData.raw.alergias,
        cirurgias: historiaData.raw.cirurgias,
        traumas: historiaData.raw.traumas,
        perdas_recentes: historiaData.raw.perdas,
        pressao_arterial: exameFisico.pa || '',
        frequencia_cardiaca: Number(exameFisico.fc) || 0,
        frequencia_respiratoria: Number(exameFisico.fr) || 0,
        temperatura: Number(exameFisico.temp) || 0,
        imc: Number(imc) || 0,
        exame_neurologico: exameFisico.neuro || '',
        exame_psiquico: exameFisico.psiquico || '',
        exame_fisico: exameFisico,
        impressao_clinica: impressaoData.texto,
        impressao_ia: impressaoData.isAi ? impressaoData.texto : '',
      })
      toast({ description: '✅ Anamnese estruturada com sucesso!' })
      navigate(`/pacientes/${id}`)
    } catch (error) {
      toast({ description: '❌ Erro ao salvar a anamnese.', variant: 'destructive' })
    }
  }

  if (!paciente)
    return (
      <div className="p-12 text-center text-[14px] font-normal text-slate-500 animate-fade-in">
        Carregando dados do paciente...
      </div>
    )

  return (
    <div className="max-w-[1000px] mx-auto space-y-8 pb-20 animate-fade-in">
      <div className="flex flex-col gap-4 mb-8">
        <Button
          variant="ghost"
          className="w-fit gap-2 -ml-4 text-[14px] font-normal text-slate-500 hover:text-slate-900 transition-all duration-300 hover:-translate-y-0.5"
          asChild
        >
          <Link to={`/pacientes/${id}`}>
            <ArrowLeft className="w-4 h-4" /> Voltar para Perfil
          </Link>
        </Button>
        <div>
          <h1 className="text-[24px] font-bold text-slate-900">
            Anamnese Estruturada — Assistida por IA 🤖
          </h1>
          <p className="text-[14px] font-normal text-slate-500 mt-1">
            Paciente: <span className="font-semibold text-slate-700">{paciente.nome}</span>
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <section className="mb-8">
          <h2 className="text-[24px] font-bold mb-4 text-slate-800 border-b pb-2">
            1. Queixa Principal
          </h2>
          <QueixaSection pacienteId={id!} data={queixaData} onChange={setQueixaData} />
        </section>

        <section className="mb-8">
          <h2 className="text-[24px] font-bold mb-4 text-slate-800 border-b pb-2">
            2. História Clínica
          </h2>
          <HistoriaSection pacienteId={id!} data={historiaData} onChange={setHistoriaData} />
        </section>

        <section className="mb-8">
          <h2 className="text-[24px] font-bold mb-4 text-slate-800 border-b pb-2">
            3. Exame Físico
          </h2>
          <ExameFisicoSection value={exameFisico} onChange={setExameFisico} />
        </section>

        <section className="mb-8">
          <h2 className="text-[24px] font-bold mb-4 text-slate-800 border-b pb-2">
            4. Impressão Clínica
          </h2>
          <ImpressaoSection
            pacienteId={id!}
            context={{
              queixa: queixaData.struct,
              resumo: historiaData.resumo,
              exame_fisico: exameFisico,
            }}
            data={impressaoData}
            onChange={setImpressaoData}
          />
        </section>

        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t">
          <Button
            variant="outline"
            className="w-full sm:w-auto text-[14px] font-normal hover:shadow-elevation hover:-translate-y-0.5 transition-all duration-300"
            asChild
          >
            <Link to={`/pacientes/${id}`}>Cancelar</Link>
          </Button>
          <Button
            onClick={handleSave}
            className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground text-[14px] font-bold hover:shadow-elevation hover:-translate-y-0.5 transition-all duration-300"
          >
            💾 Confirmar Anamnese
          </Button>
        </div>
      </div>
    </div>
  )
}

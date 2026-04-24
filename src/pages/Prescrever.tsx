import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, FileText } from 'lucide-react'

export default function Prescrever() {
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: 'Protocolo prescrito com sucesso',
      description: 'O paciente foi adicionado e as sessões foram agendadas na unidade clínica.',
    })
    setTimeout(() => navigate('/'), 1500)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Prescrever Protocolo</h1>
        <p className="text-muted-foreground mt-1">
          Inicie um novo tratamento de neuroestimulação para um paciente.
        </p>
      </div>

      <Card className="shadow-sm border-slate-200 bg-white">
        <form onSubmit={handleSubmit}>
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-6">
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileText className="w-5 h-5 text-primary" /> Nova Prescrição
            </CardTitle>
            <CardDescription className="text-sm">
              Preencha os dados clínicos e selecione o protocolo adequado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label htmlFor="patientName" className="text-slate-700 font-medium">
                Nome Completo do Paciente
              </Label>
              <Input
                id="patientName"
                placeholder="Ex: Carlos Albuquerque"
                required
                className="bg-slate-50 focus-visible:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="protocol" className="text-slate-700 font-medium">
                  Protocolo Clínico
                </Label>
                <Select required>
                  <SelectTrigger id="protocol" className="bg-slate-50 focus:bg-white">
                    <SelectValue placeholder="Selecione o tratamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reac">REAC (Otimização Neuropsicofísica)</SelectItem>
                    <SelectItem value="tdcs">tDCS (Estimulação por Corrente Contínua)</SelectItem>
                    <SelectItem value="tacs">tACS (Estimulação por Corrente Alternada)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessions" className="text-slate-700 font-medium">
                  Número de Sessões Recomendadas
                </Label>
                <Input
                  id="sessions"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="Ex: 18"
                  required
                  className="bg-slate-50 focus-visible:bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-slate-700 font-medium">
                Observações Clínicas (Opcional)
              </Label>
              <textarea
                id="notes"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:bg-white transition-colors"
                placeholder="Insira detalhes relevantes sobre o histórico, comorbidades ou orientações específicas para a equipe de aplicação..."
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t border-slate-100 pt-6 pb-6 bg-slate-50/50">
            <Button type="button" variant="outline" onClick={() => navigate('/')}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2">
              <PlusCircle className="w-4 h-4" />
              Prescrever Tratamento
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

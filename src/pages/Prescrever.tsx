import { useState } from 'react'
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
import { PlusCircle, FileText, Loader2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'

export default function Prescrever() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(false)
  const [patientName, setPatientName] = useState('')
  const [protocol, setProtocol] = useState('')
  const [sessions, setSessions] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientName || !protocol || !sessions) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const pt = await pb.collection('pacientes').create({
        usuario_id: user.id,
        nome: patientName,
        unidade: user.unidade || 'Cidade A',
        ativo: true,
      })

      const prot = await pb.collection('protocolos').create({
        usuario_id: user.id,
        paciente_id: pt.id,
        tipo: protocol,
        total_sessoes: parseInt(sessions),
        sessoes_concluidas: 0,
        status: 'ativo',
      })

      for (let i = 1; i <= parseInt(sessions); i++) {
        const d = new Date()
        d.setDate(d.getDate() + i * 2)
        await pb.collection('sessoes').create({
          usuario_id: user.id,
          paciente_id: pt.id,
          protocolo_id: prot.id,
          numero_sessao: i,
          status: 'agendada',
          data_agendada: d.toISOString(),
          observacoes: i === 1 ? notes : '',
        })
      }

      toast({
        title: 'Protocolo prescrito com sucesso',
        description: 'O paciente foi adicionado e as sessões agendadas.',
      })
      navigate('/')
    } catch (error) {
      toast({
        title: 'Erro na prescrição',
        description: 'Não foi possível concluir.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
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
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
                className="bg-slate-50 focus-visible:bg-white"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="protocol" className="text-slate-700 font-medium">
                  Protocolo Clínico
                </Label>
                <Select required value={protocol} onValueChange={setProtocol}>
                  <SelectTrigger id="protocol" className="bg-slate-50 focus:bg-white">
                    <SelectValue placeholder="Selecione o tratamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REAC">REAC (Otimização Neuropsicofísica)</SelectItem>
                    <SelectItem value="tDCS">tDCS (Estimulação por Corrente Contínua)</SelectItem>
                    <SelectItem value="tACS">tACS (Estimulação por Corrente Alternada)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessions" className="text-slate-700 font-medium">
                  Número de Sessões
                </Label>
                <Input
                  id="sessions"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="Ex: 18"
                  value={sessions}
                  onChange={(e) => setSessions(e.target.value)}
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
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="flex min-h-[120px] w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 focus-visible:bg-white transition-colors"
                placeholder="Insira detalhes relevantes..."
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t border-slate-100 pt-6 pb-6 bg-slate-50/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="gap-2" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PlusCircle className="w-4 h-4" />
              )}
              Prescrever Tratamento
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

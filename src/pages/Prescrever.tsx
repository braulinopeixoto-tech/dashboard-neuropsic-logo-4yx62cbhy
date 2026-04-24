import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import {
  Search,
  CalendarIcon,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CalendarCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const PROTOCOLS = {
  REAC: {
    nome: 'REAC',
    sessoes: 18,
    intervalo: 60,
    duracao: '2 min',
    regras: 'Até 4 sessões/dia',
  },
  tDCS: {
    nome: 'tDCS',
    sessoes: 18,
    intervalo: 1440,
    duracao: '20 min',
    regras: '1 sessão/dia',
  },
  tACS: {
    nome: 'tACS',
    sessoes: 18,
    intervalo: 1440,
    duracao: '20 min',
    regras: '1 sessão/dia',
  },
}

export default function Prescrever() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [step, setStep] = useState(1)

  const [search, setSearch] = useState('')
  const [patients, setPatients] = useState<any[]>([])
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [selectedPatientId, setSelectedPatientId] = useState('')

  const [protocol, setProtocol] = useState<'REAC' | 'tDCS' | 'tACS'>('REAC')

  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [suggestedDates, setSuggestedDates] = useState<Date[]>([])
  const [sendWhatsApp, setSendWhatsApp] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoadingPatients(true)
        const records = await pb.collection('pacientes').getFullList({
          filter: 'ativo = true',
          sort: '-created',
        })
        setPatients(records)
      } catch (err) {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os pacientes.',
          variant: 'destructive',
        })
      } finally {
        setLoadingPatients(false)
      }
    }
    fetchPatients()
  }, [toast])

  const filteredPatients = useMemo(() => {
    return patients.filter(
      (p) =>
        p.nome.toLowerCase().includes(search.toLowerCase()) ||
        (p.email && p.email.toLowerCase().includes(search.toLowerCase())),
    )
  }, [patients, search])

  const handleSuggestDates = () => {
    if (!startDate) return
    const dates: Date[] = []
    let currentDate = new Date(startDate)
    currentDate.setHours(8, 0, 0, 0)

    let sessionsAdded = 0
    const maxPerDay = protocol === 'REAC' ? 4 : 1
    const intervalHours = protocol === 'REAC' ? 1 : 24

    let attempts = 0
    while (sessionsAdded < 18 && attempts < 100) {
      const dayOfWeek = currentDate.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        for (let i = 0; i < maxPerDay && sessionsAdded < 18; i++) {
          const sessionDate = new Date(currentDate)
          sessionDate.setHours(8 + i * intervalHours, 0, 0, 0)
          dates.push(sessionDate)
          sessionsAdded++
        }
      }
      currentDate.setDate(currentDate.getDate() + 1)
      attempts++
    }

    if (dates.length < 18) {
      toast({
        title: 'Erro ao sugerir datas',
        description: 'Não foi possível alocar todas as sessões em 4 semanas.',
        variant: 'destructive',
      })
      return
    }

    setSuggestedDates(dates)
  }

  const handleSubmit = async () => {
    if (!selectedPatientId || !protocol || suggestedDates.length !== 18) return

    try {
      setIsSubmitting(true)

      const protocoloData = {
        usuario_id: user.id,
        paciente_id: selectedPatientId,
        tipo: protocol,
        total_sessoes: 18,
        sessoes_concluidas: 0,
        intervalo_minimo_minutos: PROTOCOLS[protocol].intervalo,
        data_inicio: suggestedDates[0].toISOString(),
        data_prevista_fim: suggestedDates[17].toISOString(),
        status: 'ativo',
      }

      const novoProtocolo = await pb.collection('protocolos').create(protocoloData)

      const sessionPromises = suggestedDates.map((date, index) => {
        return pb.collection('sessoes').create({
          usuario_id: user.id,
          paciente_id: selectedPatientId,
          protocolo_id: novoProtocolo.id,
          numero_sessao: index + 1,
          status: 'agendada',
          data_agendada: date.toISOString(),
        })
      })

      await Promise.all(sessionPromises)

      toast({
        title: 'Protocolo prescrito com sucesso!',
        description: 'O tratamento foi agendado.',
      })
      navigate('/')
    } catch (err) {
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar o protocolo. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const stepsList = [
    { num: 1, label: 'Paciente' },
    { num: 2, label: 'Protocolo' },
    { num: 3, label: 'Agendamento' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Novo Protocolo</h1>
        <p className="text-muted-foreground mt-1">
          Configure um novo tratamento e agende as sessões automaticamente.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        {stepsList.map((s, idx) => (
          <div
            key={s.num}
            className={cn(
              'flex items-center gap-3',
              step === s.num ? 'text-primary' : 'text-muted-foreground',
              idx < stepsList.length - 1 ? 'md:flex-1' : '',
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold shrink-0 transition-colors',
                step === s.num
                  ? 'border-primary bg-primary/10 text-primary'
                  : step > s.num
                    ? 'border-primary bg-primary text-white'
                    : 'border-muted',
              )}
            >
              {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
            </div>
            <span className="font-medium text-sm md:text-base">{s.label}</span>
            {idx < stepsList.length - 1 && (
              <div className="hidden md:block h-[2px] bg-slate-100 flex-1 ml-2 mr-4" />
            )}
          </div>
        ))}
      </div>

      <Card className="shadow-sm border-slate-200 bg-white">
        <CardContent className="pt-6">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente por nome ou email"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-slate-50 focus-visible:bg-white"
                />
              </div>
              <ScrollArea className="h-[400px] border rounded-md p-2 bg-slate-50/50">
                {loadingPatients ? (
                  <div className="space-y-2 p-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                    <Search className="w-8 h-8 mb-2 opacity-20" />
                    <p>Nenhum paciente disponível</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredPatients.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPatientId(p.id)}
                        className={cn(
                          'p-4 rounded-lg border cursor-pointer transition-all',
                          selectedPatientId === p.id
                            ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary'
                            : 'border-slate-200 bg-white hover:border-primary/50',
                        )}
                      >
                        <div className="font-semibold text-slate-900">{p.nome}</div>
                        <div className="text-sm text-slate-500 mt-1 flex justify-between">
                          <span>{p.email || 'Sem email cadastrado'}</span>
                          {p.telefone && <span>{p.telefone}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-medium text-slate-800 mb-4">
                Selecione o tipo de tratamento
              </h3>
              <RadioGroup
                value={protocol}
                onValueChange={(val: any) => setProtocol(val)}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {Object.entries(PROTOCOLS).map(([key, p]) => (
                  <Label
                    key={key}
                    className={cn(
                      'relative flex flex-col p-5 border rounded-xl cursor-pointer hover:bg-slate-50 transition-all',
                      protocol === key
                        ? 'border-primary ring-2 ring-primary bg-primary/5 shadow-sm'
                        : 'border-slate-200 bg-white',
                    )}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <RadioGroupItem value={key} id={key} className="sr-only" />
                      <BrainCircuit
                        className={cn(
                          'w-6 h-6',
                          protocol === key ? 'text-primary' : 'text-muted-foreground',
                        )}
                      />
                      <span className="font-bold text-xl">{p.nome}</span>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600 mt-2 bg-white/60 p-3 rounded-lg border border-slate-100">
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-500">Sessões</span>
                        <span className="text-slate-900 font-semibold">{p.sessoes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-500">Intervalo mín.</span>
                        <span className="text-slate-900 font-semibold">
                          {p.nome === 'REAC' ? '1 hora' : '24 horas'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-500">Duração est.</span>
                        <span className="text-slate-900 font-semibold">{p.duracao}</span>
                      </div>
                      <div className="pt-2 mt-2 border-t border-slate-100">
                        <span className="font-medium text-slate-500 block mb-1">
                          Regras adicionais:
                        </span>
                        <span className="text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block text-xs font-medium">
                          {p.regras}
                        </span>
                      </div>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="space-y-4 md:w-1/3">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <Label className="text-slate-700 font-semibold mb-2 block">
                      Data de Início
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal bg-white',
                            !startDate && 'text-muted-foreground',
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? startDate.toLocaleDateString('pt-BR') : 'Selecione a data'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Button
                      variant="default"
                      className="w-full mt-4 gap-2"
                      onClick={handleSuggestDates}
                    >
                      <CalendarCheck className="w-4 h-4" />
                      Sugerir datas
                    </Button>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-slate-800 font-semibold text-base">
                      Agenda Sugerida
                    </Label>
                    <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                      {suggestedDates.length}/18 sessões
                    </span>
                  </div>
                  {suggestedDates.length > 0 ? (
                    <ScrollArea className="h-[280px] border rounded-xl p-3 bg-slate-50/50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-3">
                        {suggestedDates.map((d, i) => (
                          <div
                            key={i}
                            className="text-sm bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between hover:border-primary/30 transition-colors"
                          >
                            <span className="font-semibold text-primary bg-primary/5 px-2 py-1 rounded-md">
                              #{i + 1}
                            </span>
                            <div className="text-right">
                              <div className="font-medium text-slate-900">
                                {d.toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })}
                              </div>
                              <div className="text-slate-500 text-xs">
                                {d.toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="h-[280px] border border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground bg-slate-50/30 text-sm">
                      <CalendarIcon className="w-10 h-10 mb-3 opacity-20" />
                      <p>Clique em "Sugerir datas" para visualizar a agenda.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3 border border-emerald-100 p-4 rounded-xl bg-emerald-50/30">
                <Checkbox
                  id="whatsapp"
                  checked={sendWhatsApp}
                  onCheckedChange={(checked) => setSendWhatsApp(checked as boolean)}
                />
                <label
                  htmlFor="whatsapp"
                  className="text-sm font-medium text-slate-800 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Confirmar e enviar para WhatsApp (simulado)
                </label>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t border-slate-100 p-6 bg-slate-50/50 rounded-b-xl">
          <Button
            variant="outline"
            onClick={() => (step > 1 ? setStep(step - 1) : navigate('/'))}
            disabled={isSubmitting}
            className="bg-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {step === 1 ? 'Cancelar' : 'Voltar'}
          </Button>

          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={(step === 1 && !selectedPatientId) || (step === 2 && !protocol)}
            >
              Próximo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={suggestedDates.length !== 18 || isSubmitting}
              className="bg-primary hover:bg-primary/90 text-white font-medium"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Prescrever
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { ChevronLeft, Upload, File as FileIcon, X } from 'lucide-react'

const phoneRegex = /^\+55 \d{2} \d{4,5}-\d{4}$/

const formSchema = z.object({
  nome: z.string().min(1, 'Campo obrigatório: Nome completo'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().regex(phoneRegex, 'Formato: +55 XX XXXXX-XXXX'),
  endereco: z.string().min(1, 'Campo obrigatório: Endereço'),
  data_nascimento: z.string().min(1, 'Campo obrigatório: Data de nascimento'),
  unidade: z.string().min(1, 'Campo obrigatório: Unidade'),
  documento: z.string().min(1, 'Campo obrigatório: Documento (CPF ou RG)'),
  queixa_principal: z.string().optional(),
  historico_medico: z.string().optional(),
  medicacoes_atuais: z.string().optional(),
  examesConfirmados: z.boolean().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function NovoPaciente() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      endereco: '',
      data_nascimento: '',
      unidade: '',
      documento: '',
      queixa_principal: '',
      historico_medico: '',
      medicacoes_atuais: '',
      examesConfirmados: false,
    },
  })

  const handleNext = async () => {
    const valid = await form.trigger([
      'nome',
      'email',
      'telefone',
      'endereco',
      'data_nascimento',
      'unidade',
      'documento',
    ])
    if (valid) setStep(2)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files)
      const validFiles = selected.filter(
        (f) => f.type === 'application/pdf' || f.type === 'image/jpeg' || f.type === 'image/jpg',
      )
      if (validFiles.length !== selected.length) {
        toast.error('Apenas arquivos PDF e JPG são permitidos.')
      }
      setFiles((prev) => [...prev, ...validFiles])
    }
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: FormValues) => {
    if (files.length > 0 && !data.examesConfirmados) {
      toast.error('Confirme que os exames foram digitalizados e anexados.')
      return
    }

    setIsSubmitting(true)
    try {
      if (data.email) {
        try {
          const existing = await pb
            .collection('pacientes')
            .getFirstListItem(`email="${data.email}"`)
          if (existing) {
            toast.error('Email já cadastrado')
            setIsSubmitting(false)
            return
          }
        } catch (err) {
          // not found, we can proceed
        }
      }

      const formData = new FormData()
      formData.append('nome', data.nome)
      if (data.email) formData.append('email', data.email)
      formData.append('telefone', data.telefone)
      formData.append('endereco', data.endereco)
      formData.append('data_nascimento', data.data_nascimento + ' 12:00:00.000Z')
      formData.append('unidade', data.unidade)
      formData.append('documento', data.documento)
      if (data.queixa_principal) formData.append('queixa_principal', data.queixa_principal)
      if (data.historico_medico) formData.append('historico_medico', data.historico_medico)
      if (data.medicacoes_atuais) formData.append('medicacoes_atuais', data.medicacoes_atuais)
      formData.append('ativo', 'true')
      if (user?.id) formData.append('usuario_id', user.id)

      files.forEach((f) => formData.append('exames', f))

      const record = await pb.collection('pacientes').create(formData)

      toast.success('Paciente cadastrado com sucesso!')
      navigate(`/pacientes/${record.id}`)
    } catch (error: any) {
      toast.error(error.message || 'Erro ao cadastrar paciente')
      setIsSubmitting(false)
    }
  }

  if (isSubmitting) {
    return (
      <div className="space-y-6 max-w-[800px] mx-auto animate-fade-in-up pb-12">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
          <Skeleton className="h-8 w-1/3 mb-6" />
          <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <div className="flex justify-end pt-4">
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-[800px] mx-auto animate-fade-in-up pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/pacientes')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Cadastrar Novo Paciente
          </h1>
          <p className="text-muted-foreground mt-1">
            Preencha os dados básicos e o relatório clínico inicial.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {step === 1 && (
            <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm animate-fade-in">
              <h2 className="text-xl font-semibold mb-6 text-slate-900 border-b pb-4">
                Seção 1: Dados Básicos
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Nome completo <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: João da Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="joao@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Telefone <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+55 11 99999-9999"
                          {...field}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '')
                            if (val.length === 0) {
                              field.onChange('')
                              return
                            }
                            if (!val.startsWith('55')) val = '55' + val
                            let formatted = '+' + val.substring(0, 2)
                            if (val.length > 2) formatted += ' ' + val.substring(2, 4)
                            if (val.length > 4) {
                              const p3 = val.length > 12 ? val.substring(4, 9) : val.substring(4, 8)
                              formatted += ' ' + p3
                              const p4 =
                                val.length > 12 ? val.substring(9, 13) : val.substring(8, 12)
                              if (p4) formatted += '-' + p4
                            }
                            field.onChange(formatted)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="data_nascimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Data de nascimento <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="documento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Documento (CPF/RG) <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Apenas números ou formato padrão" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Unidade <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a unidade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Cidade A">Cidade A</SelectItem>
                          <SelectItem value="Cidade B">Cidade B</SelectItem>
                          <SelectItem value="Cidade C">Cidade C</SelectItem>
                          <SelectItem value="Cidade D">Cidade D</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endereco"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>
                        Endereço <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Rua, número, bairro, cidade - UF" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mt-8 flex justify-end">
                <Button type="button" onClick={handleNext} className="w-full sm:w-auto">
                  Próximo
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm animate-fade-in">
              <h2 className="text-xl font-semibold mb-6 text-slate-900 border-b pb-4">
                Seção 2: Quick Report
              </h2>
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="queixa_principal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Queixa principal</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva a queixa principal do paciente..."
                          className="min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="historico_medico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Histórico médico</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Doenças prévias, cirurgias, histórico familiar..."
                          className="min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="medicacoes_atuais"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medicações atuais</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Lista de medicamentos em uso, dosagem..."
                          className="min-h-[80px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 pt-4 border-t">
                  <FormLabel className="text-base font-medium text-slate-900">
                    Anexar Exames
                  </FormLabel>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('exames-upload')?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" /> Digitalizar exames
                      </Button>
                      <span className="text-sm text-slate-500">PDF ou JPG</span>
                      <input
                        id="exames-upload"
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>

                    {files.length > 0 && (
                      <div className="grid gap-2">
                        {files.map((file, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 border rounded-md bg-slate-50"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <FileIcon className="w-5 h-5 text-primary shrink-0" />
                              <span className="text-sm font-medium truncate">{file.name}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFile(i)}
                              className="text-slate-500 hover:text-red-500 shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="examesConfirmados"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-slate-50 mt-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Exames digitalizados e anexados</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Confirmo que os arquivos selecionados estão corretos.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-8 flex flex-col sm:flex-row justify-between gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="w-full sm:w-auto"
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Salvar paciente
                </Button>
              </div>
            </div>
          )}
        </form>
      </Form>
    </div>
  )
}

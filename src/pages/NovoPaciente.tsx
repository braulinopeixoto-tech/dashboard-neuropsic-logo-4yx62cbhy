import { useState, useEffect } from 'react'
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
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import {
  ChevronLeft,
  Upload,
  File as FileIcon,
  X,
  User,
  FileText,
  Hospital,
  CheckCircle,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const phoneRegex = /^\+55 \d{2} \d{4,5}-\d{4}$/

const formSchema = z.object({
  nome: z.string().min(1, 'Campo obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().regex(phoneRegex, 'Formato: +55 XX XXXXX-XXXX'),
  endereco: z.string().min(1, 'Campo obrigatório'),
  data_nascimento: z.string().min(1, 'Campo obrigatório'),
  unidade: z.string().min(1, 'Campo obrigatório'),
  documento: z.string().min(1, 'Campo obrigatório'),
  queixa_principal: z.string().optional(),
  historico_medico: z.string().optional(),
  medicacoes_atuais: z.string().optional(),
  examesConfirmados: z.boolean().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function NovoPaciente() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [files, setFiles] = useState<File[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

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

  const nextStep = async () => {
    const ok = await form.trigger([
      'nome',
      'email',
      'telefone',
      'endereco',
      'data_nascimento',
      'unidade',
      'documento',
    ])
    if (!ok) {
      const errors = form.formState.errors
      if (errors.nome || errors.endereco || errors.documento) {
        toast.error('Os campos Nome, Endereço e Documento são obrigatórios.')
      }
    } else {
      setStep(2)
    }
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const valid = Array.from(e.target.files).filter((f) =>
      ['application/pdf', 'image/jpeg', 'image/jpg'].includes(f.type),
    )
    if (valid.length !== e.target.files.length) toast.error('Apenas PDF e JPG permitidos.')
    setFiles((prev) => [...prev, ...valid])
    e.target.value = ''
  }

  const onSubmit = async (data: FormValues) => {
    if (!data.nome?.trim() || !data.endereco?.trim() || !data.documento?.trim()) {
      return toast.error('Os campos Nome, Endereço e Documento são obrigatórios.')
    }
    if (!user?.id) {
      return toast.error('Usuário não autenticado.')
    }
    if (files.length > 0 && !data.examesConfirmados) {
      return toast.error('Confirme a anexação dos exames.')
    }
    try {
      const fd = new FormData()

      // Validação de Integridade e Relacionamento (Mandatory)
      fd.append('usuario_id', user.id)
      fd.append('nome', data.nome.trim())
      fd.append('endereco', data.endereco.trim())
      fd.append('documento', data.documento.trim())
      fd.append('ativo', 'true') // Boolean via FormData sempre será enviado como string correspondente

      // Optional fields
      if (data.email?.trim()) fd.append('email', data.email.trim())
      if (data.telefone?.trim()) fd.append('telefone', data.telefone.trim())
      if (data.unidade?.trim()) fd.append('unidade', data.unidade.trim())
      if (data.queixa_principal?.trim()) fd.append('queixa_principal', data.queixa_principal.trim())
      if (data.historico_medico?.trim()) fd.append('historico_medico', data.historico_medico.trim())
      if (data.medicacoes_atuais?.trim())
        fd.append('medicacoes_atuais', data.medicacoes_atuais.trim())

      // Data Type Compliance: ISO string para compatibilidade com Date do PocketBase
      if (data.data_nascimento) {
        const dateIso = new Date(`${data.data_nascimento}T12:00:00.000Z`).toISOString()
        fd.append('data_nascimento', dateIso)
      }

      // File Upload Handling
      if (files.length > 0) {
        files.forEach((f) => fd.append('exames', f))
      }

      await pb.collection('pacientes').create(fd)
      toast.success('Paciente cadastrado com sucesso!', {
        icon: <CheckCircle className="w-5 h-5 text-success" />,
      })
      nav('/pacientes')
    } catch (err: any) {
      if (err.status === 0 || err.message === 'Failed to fetch' || err.isAbort) {
        toast.error('Falha na conexão com o servidor. Verifique sua internet e tente novamente.')
      } else if (err.status === 400) {
        // Backend Error Feedback com extractFieldErrors
        const fieldErrors = extractFieldErrors(err)
        let hasFieldErrors = false

        Object.entries(fieldErrors).forEach(([field, message]) => {
          let translatedMessage = message
          if (field === 'email' && message.toLowerCase().includes('unique')) {
            translatedMessage = 'Este e-mail já está em uso'
          }
          if (field === 'usuario_id') {
            toast.error(
              'Erro de integridade no relacionamento do usuário. Tente fazer login novamente.',
            )
          } else {
            form.setError(field as any, { type: 'server', message: translatedMessage })
          }
          hasFieldErrors = true
        })

        if (hasFieldErrors) {
          toast.error('Verifique os erros apontados nos campos destacados.')
          if (
            step === 2 &&
            (fieldErrors.nome ||
              fieldErrors.email ||
              fieldErrors.telefone ||
              fieldErrors.data_nascimento ||
              fieldErrors.documento ||
              fieldErrors.unidade ||
              fieldErrors.endereco)
          ) {
            setStep(1)
          }
        } else {
          toast.error('Erro de validação no servidor. Verifique os campos e tente novamente.')
        }
      } else {
        toast.error('Erro ao salvar os dados do paciente. Tente novamente mais tarde.')
      }
    }
  }

  if (!mounted) return null

  return (
    <div className="max-w-[800px] mx-auto animate-in fade-in duration-300 pb-[32px] px-4 md:px-0">
      <div className="flex items-center gap-[16px] mb-[32px]">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => nav('/pacientes')}
          className="hover:shadow-elevation transition-all duration-300"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-[24px] font-bold text-slate-900">Novo Paciente</h1>
          <p className="text-[14px] font-normal text-muted-foreground mt-1">
            Preencha os dados e relatório clínico.
          </p>
        </div>
      </div>

      <div className="mb-[32px] relative px-[20px] max-w-md mx-auto">
        <div className="absolute left-[40px] right-[40px] top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>
        <div className="relative z-10 flex justify-between">
          <div className="flex flex-col items-center gap-2">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px] transition-colors duration-300',
                step >= 1
                  ? 'bg-primary text-white shadow-elevation'
                  : 'bg-slate-200 text-slate-500',
              )}
            >
              {step > 1 ? <Check className="w-5 h-5" /> : '1'}
            </div>
            <span className="text-[16px] font-semibold text-slate-700 bg-background px-2">
              Dados Básicos
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px] transition-colors duration-300',
                step >= 2
                  ? 'bg-primary text-white shadow-elevation'
                  : 'bg-slate-200 text-slate-500',
              )}
            >
              2
            </div>
            <span className="text-[16px] font-semibold text-slate-700 bg-background px-2">
              Quick Report
            </span>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {step === 1 && (
            <div className="bg-white p-[20px] rounded-xl border border-slate-200 shadow-subtle animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-[16px] font-semibold mb-[16px] flex items-center gap-2 border-b pb-4">
                <User className="w-5 h-5 text-primary" /> Dados Pessoais
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[14px] font-normal">Nome *</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel className="text-[14px] font-normal">Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
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
                      <FormLabel className="text-[14px] font-normal">Telefone *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => {
                            let v = e.target.value.replace(/\D/g, '')
                            if (!v) return field.onChange('')
                            if (!v.startsWith('55')) v = '55' + v
                            field.onChange(
                              '+' +
                                v.substring(0, 2) +
                                (v.length > 2 ? ' ' + v.substring(2, 4) : '') +
                                (v.length > 4 ? ' ' + v.substring(4, 9) : '') +
                                (v.length > 9 ? '-' + v.substring(9, 13) : ''),
                            )
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
                      <FormLabel className="text-[14px] font-normal">Data Nascimento *</FormLabel>
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
                      <FormLabel className="text-[14px] font-normal flex items-center gap-1">
                        <FileText className="w-4 h-4 text-slate-500" /> Documento (CPF/RG) *
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel className="text-[14px] font-normal">Unidade *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Cidade A">Cidade A</SelectItem>
                          <SelectItem value="Cidade B">Cidade B</SelectItem>
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
                      <FormLabel className="text-[14px] font-normal">Endereço *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mt-[32px] flex justify-end">
                <Button
                  type="button"
                  onClick={nextStep}
                  className="hover:shadow-elevation transition-all duration-300"
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-white p-[20px] rounded-xl border border-slate-200 shadow-subtle animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-[16px] font-semibold mb-[16px] flex items-center gap-2 border-b pb-4">
                <Hospital className="w-5 h-5 text-primary" /> Relatório Clínico
              </h2>
              <div className="flex flex-col gap-[16px]">
                <FormField
                  control={form.control}
                  name="queixa_principal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[14px] font-normal">Queixa Principal</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[80px]" {...field} />
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
                      <FormLabel className="text-[14px] font-normal">Histórico Médico</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[80px]" {...field} />
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
                      <FormLabel className="text-[14px] font-normal">Medicações Atuais</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[80px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-[16px] border-t mt-[16px]">
                  <FormLabel className="text-[16px] font-semibold text-slate-900 mb-4 block">
                    Anexar Exames
                  </FormLabel>
                  <div className="flex flex-col gap-[16px]">
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        className="hover:shadow-elevation transition-all duration-300"
                      >
                        <Upload className="w-4 h-4 mr-2" /> Digitalizar
                      </Button>
                      <span className="text-[14px] font-normal text-slate-500">PDF ou JPG</span>
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg"
                        className="hidden"
                        onChange={handleFile}
                      />
                    </div>
                    {files.length > 0 && (
                      <div className="grid gap-2">
                        {files.map((f, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 border rounded-md bg-slate-50"
                          >
                            <div className="flex items-center gap-3">
                              <FileIcon className="w-4 h-4 text-primary" />
                              <span className="text-[14px] font-normal">{f.name}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}
                              className="hover:text-error transition-colors"
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
                    <FormItem className="flex items-start gap-3 p-4 bg-slate-50 border rounded-md mt-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1">
                        <FormLabel className="text-[14px] font-normal leading-none cursor-pointer">
                          Exames digitalizados e anexados corretamente
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              <div className="mt-[32px] flex justify-between gap-[16px]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="hover:shadow-elevation transition-all duration-300"
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="hover:shadow-elevation transition-all duration-300 bg-primary text-white"
                >
                  Salvar Paciente
                </Button>
              </div>
            </div>
          )}
        </form>
      </Form>
    </div>
  )
}

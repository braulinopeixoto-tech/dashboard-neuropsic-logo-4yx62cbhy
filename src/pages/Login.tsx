import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/hooks/use-auth'
import { Navigate, useNavigate, Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

const loginSchema = z.object({
  email: z.string().min(1, 'Campo obrigatório').email('Email inválido'),
  password: z.string().min(1, 'Campo obrigatório'),
  rememberMe: z.boolean().optional(),
})

const signUpSchema = z
  .object({
    name: z.string().min(1, 'Campo obrigatório'),
    email: z.string().min(1, 'Campo obrigatório').email('Email inválido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirmPassword: z.string().min(1, 'Campo obrigatório'),
    tipo: z.enum(['neuropsicólogo', 'assistente_líder', 'neuromoduladora'], {
      required_error: 'Campo obrigatório',
    }),
    unidade: z.string().min(1, 'Campo obrigatório'),
    terms: z.literal(true, {
      errorMap: () => ({ message: 'Campo obrigatório' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não conferem',
    path: ['confirmPassword'],
  })

type LoginForm = z.infer<typeof loginSchema>
type SignUpForm = z.infer<typeof signUpSchema>

function LoginFormView({
  loading,
  onSubmit,
}: {
  loading: boolean
  onSubmit: (d: LoginForm) => void
}) {
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  })

  const { resetPassword } = useAuth()
  const { toast } = useToast()
  const [resetLoading, setResetLoading] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetOpen, setResetOpen] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetEmail) {
      toast({
        title: 'Erro',
        description: 'Informe o email para recuperação.',
        variant: 'destructive',
      })
      return
    }
    setResetLoading(true)
    const { error } = await resetPassword(resetEmail)
    setResetLoading(false)
    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível solicitar a recuperação.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Sucesso',
        description: 'Email de recuperação enviado com sucesso.',
      })
      setResetOpen(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="seu@email.com"
          className="h-11"
          {...form.register('email')}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password">Senha</Label>
          <Dialog open={resetOpen} onOpenChange={setResetOpen}>
            <DialogTrigger asChild>
              <a
                href="#"
                className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
                onClick={(e) => e.preventDefault()}
              >
                Esqueceu a senha?
              </a>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Recuperar Senha</DialogTitle>
                <DialogDescription>
                  Informe seu email abaixo para receber as instruções de recuperação de senha.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleResetPassword} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={resetLoading}>
                  {resetLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Enviar
                  Instruções
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <Input
          id="login-password"
          type="password"
          placeholder="••••••••"
          className="h-11"
          {...form.register('password')}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
        )}
      </div>
      <div className="flex items-center space-x-2 py-2">
        <Controller
          name="rememberMe"
          control={form.control}
          render={({ field }) => (
            <Checkbox id="login-remember" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <Label htmlFor="login-remember" className="text-sm font-medium leading-none cursor-pointer">
          Lembrar-me
        </Label>
      </div>
      <Button type="submit" className="w-full h-11 text-base mt-2" disabled={loading}>
        {loading && <Loader2 className="w-5 h-5 animate-spin mr-2" />} Entrar
      </Button>
    </form>
  )
}

function SignUpFormView({
  loading,
  onSubmit,
}: {
  loading: boolean
  onSubmit: (d: SignUpForm, setErr: any) => void
}) {
  const form = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      unidade: '',
      terms: false as unknown as true,
    },
  })

  const termsChecked = form.watch('terms')
  const [termsOpen, setTermsOpen] = useState(false)

  return (
    <form onSubmit={form.handleSubmit((d) => onSubmit(d, form.setError))} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Nome Completo</Label>
        <Input
          id="signup-name"
          placeholder="Ex: Maria Silva"
          className="h-11"
          {...form.register('name')}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="seu@email.com"
          className="h-11"
          {...form.register('email')}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="signup-password">Senha</Label>
          <Input
            id="signup-password"
            type="password"
            placeholder="••••••••"
            className="h-11"
            {...form.register('password')}
          />
          {form.formState.errors.password && (
            <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-confirmPassword">Confirmar Senha</Label>
          <Input
            id="signup-confirmPassword"
            type="password"
            placeholder="••••••••"
            className="h-11"
            {...form.register('confirmPassword')}
          />
          {form.formState.errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {form.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-tipo">Tipo Profissional</Label>
        <Controller
          name="tipo"
          control={form.control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger id="signup-tipo" className="h-11">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="neuropsicólogo">Neuropsicólogo</SelectItem>
                <SelectItem value="assistente_líder">Assistente Líder</SelectItem>
                <SelectItem value="neuromoduladora">Neuromoduladora</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.tipo && (
          <p className="text-sm text-destructive">{form.formState.errors.tipo.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-unidade">Unidade (Clínica/Filial)</Label>
        <Controller
          name="unidade"
          control={form.control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger id="signup-unidade" className="h-11">
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cidade A">Unidade Cidade A</SelectItem>
                <SelectItem value="Cidade B">Unidade Cidade B</SelectItem>
                <SelectItem value="Cidade C">Unidade Cidade C</SelectItem>
                <SelectItem value="Cidade D">Unidade Cidade D</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.unidade && (
          <p className="text-sm text-destructive">{form.formState.errors.unidade.message}</p>
        )}
      </div>
      <div className="flex items-start space-x-2 py-2 mt-2">
        <Controller
          name="terms"
          control={form.control}
          render={({ field }) => (
            <Checkbox
              id="signup-terms"
              checked={field.value}
              onCheckedChange={field.onChange}
              className="mt-1"
            />
          )}
        />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor="signup-terms" className="text-sm font-medium cursor-pointer">
            Concordo com os termos
          </Label>
          <p className="text-sm text-slate-500">
            Você aceita nossos{' '}
            <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
              <DialogTrigger asChild>
                <a
                  href="#"
                  className="text-primary hover:underline"
                  onClick={(e) => e.preventDefault()}
                >
                  Termos de Serviço e Política de Privacidade
                </a>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Termos de Serviço e Política de Privacidade</DialogTitle>
                </DialogHeader>
                <div className="text-sm text-slate-600 space-y-4 pt-4">
                  <p>
                    <strong>1. Uso da Plataforma:</strong> O NeuroDash destina-se ao agendamento e
                    gerenciamento de sessões de neuromodulação clínica.
                  </p>
                  <p>
                    <strong>2. Privacidade e LGPD:</strong> Todos os dados inseridos estão em
                    conformidade com as diretrizes de proteção de dados, com absoluto sigilo clínico
                    preservado.
                  </p>
                  <p>
                    <strong>3. Responsabilidade do Profissional:</strong> O uso clínico da
                    plataforma não isenta o profissional de suas responsabilidades técnicas e éticas
                    junto aos pacientes.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
            .
          </p>
          {form.formState.errors.terms && (
            <p className="text-sm text-destructive">{form.formState.errors.terms.message}</p>
          )}
        </div>
      </div>
      <Button
        type="submit"
        className="w-full h-11 text-base mt-2"
        disabled={loading || !termsChecked}
      >
        {loading && <Loader2 className="w-5 h-5 animate-spin mr-2" />} Criar conta
      </Button>
    </form>
  )
}

export default function Login() {
  const { signIn, signUp, user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('login')

  if (user) return <Navigate to="/" replace />

  const onLoginSubmit = async (data: LoginForm) => {
    setLoading(true)
    const { error } = await signIn(data.email, data.password)

    if (error) {
      setLoading(false)
      toast({
        title: 'Erro de autenticação',
        description: 'Credenciais incorretas ou usuário não encontrado.',
        variant: 'destructive',
      })
    } else {
      try {
        const userRecord = pb.authStore.record
        if (userRecord) {
          await pb.send('/backend/v1/seal_audit_log', {
            method: 'POST',
            body: {
              user_id: userRecord.id,
              event_type: 'login',
              action_description: `Usuario ${userRecord.name || 'Desconhecido'} fez login com sucesso`,
              payload: {
                email: userRecord.email,
                timestamp: new Date().toISOString(),
                user_agent: navigator.userAgent,
                ip_address: '',
              },
            },
          })
          toast({
            description: 'Login registrado em auditoria',
          })
        }
      } catch (err) {
        console.error('Erro ao registrar login em auditoria:', err)
      }

      setLoading(false)
      navigate('/')
    }
  }

  const onSignUpSubmit = async (data: SignUpForm, setError: any) => {
    setLoading(true)
    const { error } = await signUp({
      email: data.email,
      password: data.password,
      name: data.name,
      tipo: data.tipo,
      unidade: data.unidade,
    })
    setLoading(false)
    if (error) {
      const fieldErrors = extractFieldErrors(error)
      if (fieldErrors.email) {
        setError('email', { type: 'manual', message: fieldErrors.email })
        toast({
          title: 'Erro ao criar conta',
          description: 'Este email já está em uso.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Erro ao criar conta',
          description: 'Verifique os dados informados e tente novamente.',
          variant: 'destructive',
        })
      }
    } else {
      toast({
        title: 'Conta criada com sucesso!',
        description: 'Seja bem-vindo(a) ao NeuroDash.',
      })
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 py-8">
      <div className="mb-8 flex flex-col items-center text-center animate-fade-in-up">
        <img
          src="https://img.usecurling.com/i?q=neurology+logo&color=blue&shape=fill"
          alt="Clinic Logo"
          className="w-16 h-16 rounded-2xl shadow-lg mb-4"
        />
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          NeuroDash &mdash; Gestão de Neuromodulação
        </h1>
        <p className="text-slate-500 mt-2 text-lg">
          Plataforma de agendamento e sequenciamento de protocolos
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full max-w-md animate-fade-in-up"
        style={{ animationDelay: '0.1s' }}
      >
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-200/50 p-1 rounded-xl">
          <TabsTrigger value="login" className="rounded-lg data-[state=active]:shadow-sm">
            Entrar
          </TabsTrigger>
          <TabsTrigger value="signup" className="rounded-lg data-[state=active]:shadow-sm">
            Cadastro
          </TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card className="shadow-xl border-0 ring-1 ring-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold">Acesso ao Sistema</CardTitle>
              <CardDescription>
                Faça login para gerenciar seus pacientes e protocolos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginFormView loading={loading} onSubmit={onLoginSubmit} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card className="shadow-xl border-0 ring-1 ring-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
              <CardDescription>
                Preencha os dados abaixo para ter acesso à plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignUpFormView loading={loading} onSubmit={onSignUpSubmit} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

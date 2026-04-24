import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/hooks/use-auth'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { BrainCircuit, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'A senha é obrigatória'),
})

const signUpSchema = z
  .object({
    name: z.string().min(2, 'O nome é obrigatório'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
    confirmPassword: z.string(),
    tipo: z.enum(['neuropsicólogo', 'assistente_líder', 'neuromoduladora'], {
      required_error: 'Selecione um tipo profissional',
    }),
    unidade: z.string().min(1, 'A unidade é obrigatória'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type LoginForm = z.infer<typeof loginSchema>
type SignUpForm = z.infer<typeof signUpSchema>

export default function Login() {
  const { signIn, signUp, user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('login')

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const signUpForm = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
  })

  if (user) return <Navigate to="/" replace />

  const onLoginSubmit = async (data: LoginForm) => {
    setLoading(true)
    const { error } = await signIn(data.email, data.password)
    setLoading(false)

    if (error) {
      toast({
        title: 'Erro de autenticação',
        description: 'Verifique seu email e senha e tente novamente.',
        variant: 'destructive',
      })
    } else {
      navigate('/')
    }
  }

  const onSignUpSubmit = async (data: SignUpForm) => {
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
        signUpForm.setError('email', { type: 'manual', message: fieldErrors.email })
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
      <div className="mb-8 flex items-center gap-2 text-primary font-bold text-2xl animate-fade-in-up">
        <BrainCircuit className="h-8 w-8" />
        <span>NeuroDash</span>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full max-w-md animate-fade-in-up"
        style={{ animationDelay: '0.1s' }}
      >
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Cadastro</TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <Card className="shadow-elevation">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Acesso ao Sistema</CardTitle>
              <CardDescription className="text-center">
                Faça login para gerenciar seus pacientes e protocolos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    {...loginForm.register('email')}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input id="login-password" type="password" {...loginForm.register('password')} />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-500">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full mt-2" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Entrar
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signup">
          <Card className="shadow-elevation">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Criar Conta</CardTitle>
              <CardDescription className="text-center">
                Preencha os dados abaixo para ter acesso à plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={signUpForm.handleSubmit(onSignUpSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo</Label>
                  <Input
                    id="signup-name"
                    placeholder="Ex: Maria Silva"
                    {...signUpForm.register('name')}
                  />
                  {signUpForm.formState.errors.name && (
                    <p className="text-sm text-red-500">
                      {signUpForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    {...signUpForm.register('email')}
                  />
                  {signUpForm.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {signUpForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      {...signUpForm.register('password')}
                    />
                    {signUpForm.formState.errors.password && (
                      <p className="text-sm text-red-500">
                        {signUpForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirmPassword">Confirmar Senha</Label>
                    <Input
                      id="signup-confirmPassword"
                      type="password"
                      {...signUpForm.register('confirmPassword')}
                    />
                    {signUpForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-500">
                        {signUpForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-tipo">Tipo Profissional</Label>
                  <Controller
                    name="tipo"
                    control={signUpForm.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger id="signup-tipo">
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
                  {signUpForm.formState.errors.tipo && (
                    <p className="text-sm text-red-500">
                      {signUpForm.formState.errors.tipo.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-unidade">Unidade (Clínica/Filial)</Label>
                  <Input
                    id="signup-unidade"
                    placeholder="Ex: Unidade Centro"
                    {...signUpForm.register('unidade')}
                  />
                  {signUpForm.formState.errors.unidade && (
                    <p className="text-sm text-red-500">
                      {signUpForm.formState.errors.unidade.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full mt-2" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Criar Conta
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

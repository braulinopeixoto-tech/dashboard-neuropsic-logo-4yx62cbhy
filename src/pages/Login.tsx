import { useState } from 'react'
import { useForm } from 'react-hook-form'
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

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function Login() {
  const { signIn, user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  if (user) return <Navigate to="/" replace />

  const onSubmit = async (data: LoginForm) => {
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="mb-8 flex items-center gap-2 text-primary font-bold text-2xl animate-fade-in-up">
        <BrainCircuit className="h-8 w-8" />
        <span>NeuroDash</span>
      </div>
      <Card
        className="w-full max-w-md shadow-elevation animate-fade-in-up"
        style={{ animationDelay: '0.1s' }}
      >
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Acesso ao Sistema</CardTitle>
          <CardDescription className="text-center">
            Faça login para gerenciar seus pacientes e protocolos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="seu@email.com" {...register('email')} />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
